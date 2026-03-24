import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { initializeDatabase, closeDatabase } from './database'
import { createWindow, showMainWindow } from './window'
import { registerAllIpcHandlers } from './ipc'

let tray: Tray | null = null
let isQuitting = false

function createTrayIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="#2563eb"/><path d="M4 5h8v1.5H4zM4 7.5h8V9H4zM4 10h8v1.5H4z" fill="#ffffff"/></svg>`
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`)
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

