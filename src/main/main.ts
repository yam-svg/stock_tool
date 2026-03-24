import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { deflateSync } from 'zlib'
import { initializeDatabase, closeDatabase } from './database'
import { createWindow, showMainWindow } from './window'
import { registerAllIpcHandlers } from './ipc'

let tray: Tray | null = null
let isQuitting = false

function crc32(buffer: Buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i]
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(data.length, 0)

  const crcBuffer = Buffer.alloc(4)
  const chunkData = Buffer.concat([typeBuffer, data])
  crcBuffer.writeUInt32BE(crc32(chunkData), 0)

  return Buffer.concat([lengthBuffer, chunkData, crcBuffer])
}

function createRandomPngIcon(size = 32) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const palette = Array.from({ length: 5 }, () => ({
    r: 80 + Math.floor(Math.random() * 176),
    g: 80 + Math.floor(Math.random() * 176),
    b: 80 + Math.floor(Math.random() * 176),
  }))

  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    for (let x = 0; x < size; x += 1) {
      const cell = Math.floor(x / 4) + Math.floor(y / 4)
      const color = palette[cell % palette.length]
      const pixel = rowStart + 1 + x * 4
      raw[pixel] = color.r
      raw[pixel + 1] = color.g
      raw[pixel + 2] = color.b
      raw[pixel + 3] = 255
    }
  }

  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function createTrayIcon() {
  const pngBuffer = createRandomPngIcon(32)
  return nativeImage.createFromBuffer(pngBuffer).resize({ width: 16, height: 16 })
}

function createTray() {
  if (tray) return tray

  tray = new Tray(createTrayIcon())
  tray.setToolTip('Stock666')
  tray.on('click', () => {
    if (!showMainWindow()) {
      const mainWindow = createWindow()
      bindMainWindowEvents(mainWindow)
    }
  })

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开主窗口',
      click: () => {
        if (!showMainWindow()) {
          const mainWindow = createWindow()
          bindMainWindowEvents(mainWindow)
        }
      },
    },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  return tray
}

function bindMainWindowEvents(mainWindow: BrowserWindow) {
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    mainWindow.hide()
  })
}

/**
 * 应用启动流程
 */
app.whenReady().then(() => {
  // 初始化数据库
  initializeDatabase()
  // 创建主窗口
  const mainWindow = createWindow()
  bindMainWindowEvents(mainWindow)
  createTray()
  // 注册所有IPC handlers
  registerAllIpcHandlers()

  // 当所有窗口关闭时再激活app时创建新窗口
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      const nextMainWindow = createWindow()
      bindMainWindowEvents(nextMainWindow)
    } else {
      showMainWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  closeDatabase()
})

/**
 * 应用关闭流程
 */
app.on('window-all-closed', function () {
  if (isQuitting && process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('quit', () => {
  if (tray) {
    tray.destroy()
    tray = null
  }
})

