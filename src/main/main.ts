import { app, BrowserWindow } from 'electron'
import { initializeDatabase, closeDatabase } from './database'
import { createWindow } from './window'
import { registerAllIpcHandlers } from './ipc'

/**
 * 应用启动流程
 */
app.whenReady().then(() => {
  // 初始化数据库
  initializeDatabase()
  // 创建主窗口
  createWindow()
  // 注册所有IPC handlers
  registerAllIpcHandlers()

  // 当所有窗口关闭时再激活app时创建新窗口
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * 应用关闭流程
 */
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
  }
})
