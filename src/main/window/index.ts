import { BrowserWindow, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null

function resolveAppIconPath() {
  const candidates = [
    path.join(process.cwd(), 'build', 'icons', 'fa-chart-line.png'),
    path.join(process.resourcesPath, 'build', 'icons', 'fa-chart-line.png'),
    path.join(process.resourcesPath, 'app.asar', 'build', 'icons', 'fa-chart-line.png'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  // Fallback for unusual working directories during development.
  return app.isPackaged ? undefined : path.join(__dirname, '../../../build/icons/fa-chart-line.png')
}

/**
 * 创建应用窗口
 */
export function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: resolveAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5417')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

export function getMainWindow() {
  return mainWindow
}

export function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return null
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show()
  }

  mainWindow.focus()
  return mainWindow
}

