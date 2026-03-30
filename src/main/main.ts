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

function createChartLinePngIcon(size = 32) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  const raw = Buffer.alloc((size * 4 + 1) * size)
  const setPixel = (x: number, y: number, r: number, g: number, b: number, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const rowStart = y * (size * 4 + 1)
    const pixel = rowStart + 1 + x * 4
    raw[pixel] = r
    raw[pixel + 1] = g
    raw[pixel + 2] = b
    raw[pixel + 3] = a
  }

  // 蓝色底色
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    for (let x = 0; x < size; x += 1) {
      setPixel(x, y, 37, 99, 235, 255)
    }
  }

  // 白色折线（简化 FaChartLine 视觉）
  const points = [
    [6, 23],
    [11, 18],
    [16, 20],
    [22, 12],
    [27, 14],
  ] as const

  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))
    for (let s = 0; s <= steps; s += 1) {
      const x = Math.round(x1 + ((x2 - x1) * s) / steps)
      const y = Math.round(y1 + ((y2 - y1) * s) / steps)
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          setPixel(x + dx, y + dy, 255, 255, 255, 255)
        }
      }
    }
  }

  // 轴线
  for (let x = 5; x <= 27; x += 1) setPixel(x, 25, 255, 255, 255, 210)
  for (let y = 7; y <= 25; y += 1) setPixel(5, y, 255, 255, 255, 210)

  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function createTrayIcon() {
  const pngBuffer = createChartLinePngIcon(32)
  return nativeImage.createFromBuffer(pngBuffer).resize({ width: 16, height: 16 })
}

function createTray() {
  if (tray) return tray

  tray = new Tray(createTrayIcon())
  tray.setToolTip('StockLite')
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

