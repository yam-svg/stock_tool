import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import Database from 'better-sqlite3'
import { generateId } from '../shared/utils'
import axios from 'axios'

// 数据库实例
let db: Database.Database | null = null

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5417')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

function initializeDatabase() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'stocklite.db')
    db = new Database(dbPath)

    //创建分组表
    db.exec(`
      CREATE TABLE IF NOT EXISTS stock_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 创建股票表
    db.exec(`
      CREATE TABLE IF NOT EXISTS stocks (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        group_id TEXT NOT NULL,
        cost_price REAL NOT NULL,
        quantity REAL NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (group_id) REFERENCES stock_groups (id)
      )
    `)

    //创建基金分组表
    db.exec(`
      CREATE TABLE IF NOT EXISTS fund_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // 创建基金表
    db.exec(`
      CREATE TABLE IF NOT EXISTS funds (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        group_id TEXT NOT NULL,
        cost_nav REAL NOT NULL,
        shares REAL NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (group_id) REFERENCES fund_groups (id)
      )
    `)

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
  }
}

app.whenReady().then(() => {
  initializeDatabase()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (db) {
      db.close()
    }
    app.quit()
  }
})

// 分组操作IPC handlers
ipcMain.handle('db-create-stock-group', async (_event, name: string) => {
  if (!db) throw new Error('Database not initialized')

  const id = generateId()
  const createdAt = Date.now()

  const stmt = db.prepare('INSERT INTO stock_groups (id, name, created_at) VALUES (?, ?, ?)')
  stmt.run(id, name, createdAt)

  return { id, name, createdAt }
})

ipcMain.handle('db-create-fund-group', async (_event, name: string) => {
  if (!db) throw new Error('Database not initialized')

  const id = generateId()
  const createdAt = Date.now()

  const stmt = db.prepare('INSERT INTO fund_groups (id, name, created_at) VALUES (?, ?, ?)')
  stmt.run(id, name, createdAt)

  return { id, name, createdAt }
})

ipcMain.handle('db-get-stock-groups', async () => {
  if (!db) throw new Error('Database not initialized')

  const stmt = db.prepare('SELECT * FROM stock_groups ORDER BY created_at')
  return stmt.all()
})

ipcMain.handle('db-get-fund-groups', async () => {
  if (!db) throw new Error('Database not initialized')

  const stmt = db.prepare('SELECT * FROM fund_groups ORDER BY created_at')
  return stmt.all()
})

ipcMain.handle('db-update-stock-group', async (_event, id: string, name: string) => {
  if (!db) throw new Error('Database not initialized')

  const stmt = db.prepare('UPDATE stock_groups SET name = ? WHERE id = ?')
  stmt.run(name, id)
})

ipcMain.handle('db-update-fund-group', async (_event, id: string, name: string) => {
  if (!db) throw new Error('Database not initialized')

  const stmt = db.prepare('UPDATE fund_groups SET name = ? WHERE id = ?')
  stmt.run(name, id)
})

ipcMain.handle('db-delete-stock-group', async (_event, id: string) => {
  if (!db) throw new Error('Database not initialized')

  //先删除组内股票
  const deleteStocksStmt = db.prepare('DELETE FROM stocks WHERE group_id = ?')
  deleteStocksStmt.run(id)

  //再分组
  const stmt = db.prepare('DELETE FROM stock_groups WHERE id = ?')
  stmt.run(id)
})

ipcMain.handle('db-delete-fund-group', async (_event, id: string) => {
  if (!db) throw new Error('Database not initialized')

  //先删除组内基金
  const deleteFundsStmt = db.prepare('DELETE FROM funds WHERE group_id = ?')
  deleteFundsStmt.run(id)

  // 再删除分组
  const stmt = db.prepare('DELETE FROM fund_groups WHERE id = ?')
  stmt.run(id)
})

//操作IPC handlers
ipcMain.handle('db-create-stock', async (_event, stock: any) => {
  if (!db) throw new Error('Database not initialized')

  const id = generateId()
  const createdAt = Date.now()

  const stmt = db.prepare(`
    INSERT INTO stocks (id, symbol, name, group_id, cost_price, quantity, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(id, stock.symbol, stock.name, stock.groupId, stock.costPrice, stock.quantity, createdAt)

  return { id, ...stock, createdAt }
})

ipcMain.handle('db-get-stocks', async (_event, groupId?: string) => {
  if (!db) throw new Error('Database not initialized')
  
  let stmt
  if (groupId) {
    stmt = db.prepare('SELECT id, symbol, name, group_id AS groupId, cost_price AS costPrice, quantity, created_at AS createdAt FROM stocks WHERE group_id = ? ORDER BY created_at')
    return stmt.all(groupId)
  } else {
    stmt = db.prepare('SELECT id, symbol, name, group_id AS groupId, cost_price AS costPrice, quantity, created_at AS createdAt FROM stocks ORDER BY created_at')
    return stmt.all()
  }
})

ipcMain.handle('db-update-stock', async (_event, id: string, updates: any) => {
  if (!db) throw new Error('Database not initialized')

  const updateFields = Object.keys(updates).map(key => {
    if (key === 'groupId') return 'group_id = ?'
    if (key === 'costPrice') return 'cost_price = ?'
    return `${key} = ?`
  }).join(', ')

  const values = Object.keys(updates).map(key => updates[key])
  values.push(id)

  const stmt = db.prepare(`UPDATE stocks SET ${updateFields} WHERE id = ?`)
  stmt.run(...values)
})

ipcMain.handle('db-delete-stock', async (_event, id: string) => {
  if (!db) throw new Error('Database not initialized')

  const stmt = db.prepare('DELETE FROM stocks WHERE id = ?')
  stmt.run(id)
})

//基操作IPC handlers
ipcMain.handle('db-create-fund', async (_event, fund: any) => {
  if (!db) throw new Error('Database not initialized')
  
  const id = generateId()
  const createdAt = Date.now()
  
  const stmt = db.prepare(`
    INSERT INTO funds (id, code, name, group_id, cost_nav, shares, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(id, fund.code, fund.name, fund.groupId, fund.costNav, fund.shares, createdAt)
  
  return { id, ...fund, createdAt }
})

ipcMain.handle('db-get-funds', async (_event, groupId?: string) => {
  if (!db) throw new Error('Database not initialized')
  
  let stmt
  if (groupId) {
    stmt = db.prepare('SELECT id, code, name, group_id AS groupId, cost_nav AS costNav, shares, created_at AS createdAt FROM funds WHERE group_id = ? ORDER BY created_at')
    return stmt.all(groupId)
  } else {
    stmt = db.prepare('SELECT id, code, name, group_id AS groupId, cost_nav AS costNav, shares, created_at AS createdAt FROM funds ORDER BY created_at')
    return stmt.all()
  }
})

ipcMain.handle('db-update-fund', async (_event, id: string, updates: any) => {
  if (!db) throw new Error('Database not initialized')
  
  const updateFields = Object.keys(updates).map(key => {
    if (key === 'groupId') return 'group_id = ?'
    if (key === 'costNav') return 'cost_nav = ?'
    return `${key} = ?`
  }).join(', ')
  
  const values = Object.keys(updates).map(key => updates[key])
  values.push(id)
  
  const stmt = db.prepare(`UPDATE funds SET ${updateFields} WHERE id = ?`)
  stmt.run(...values)
})

ipcMain.handle('db-delete-fund', async (_event, id: string) => {
  if (!db) throw new Error('Database not initialized')

  const stmt = db.prepare('DELETE FROM funds WHERE id = ?')
  stmt.run(id)
})

//行情数据IPC handlers
ipcMain.handle('db-get-stock-quotes', async (_event, symbols: string[]) => {
  if (symbols.length === 0) return []

  try {
    const fullSymbols = symbols.map(s => {
      if (/^[0-9]{6}$/.test(s)) {
        if (s.startsWith('6')) return `sh${s}`
        if (s.startsWith('0') || s.startsWith('3')) return `sz${s}`
      }
      return s.toLowerCase()
    })

    const q = fullSymbols.join(',')
    const response = await axios.get(`https://qt.gtimg.cn/q=${q}`, {
      responseType: 'arraybuffer'
    })

    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(response.data)
    const lines = text.split(';').filter(line => line.trim())

    return lines.map(line => {
      const match = line.match(/v_([^=]+)="([^"]+)"/)
      if (!match) return null

      const symbol = match[1]
      const data = match[2].split('~')

      return {
        symbol,
        name: data[1],
        price: parseFloat(data[3]) || 0,
        change: parseFloat(data[31]) || 0,
        changePercent: parseFloat(data[32]) || 0,
        updateTime: Date.now()
      }
    }).filter(quote => quote !== null)
  } catch (error) {
    console.error('Main process fetch stock quotes failed:', error)
    return []
  }
})

ipcMain.handle('db-get-fund-quotes', async (_event, codes: string[]) => {
  if (codes.length === 0) return []

  try {
    const q = codes.map(c => `f_${c}`).join(',')
    const response = await axios.get(`https://qt.gtimg.cn/q=${q}`, {
      responseType: 'arraybuffer'
    })

    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(response.data)
    const lines = text.split(';').filter(line => line.trim())

    return lines.map(line => {
      const match = line.match(/v_([^=]+)="([^"]+)"/)
      if (!match) return null

      const code = match[1].replace('f_', '')
      const data = match[2].split('~')

      return {
        code,
        name: data[1],
        nav: parseFloat(data[3]) || 0,
        change: parseFloat(data[31]) || 0,
        changePercent: parseFloat(data[32]) || 0,
        date: data[30]
      }
    }).filter(quote => quote !== null)
  } catch (error) {
    console.error('Main process fetch fund quotes failed:', error)
    return []
  }
})

ipcMain.handle('stock-search', async (_event, keyword: string) => {
  if (!keyword.trim()) return []

  try {
    const response = await axios.get(`https://smartbox.gtimg.cn/s3/?v=2&q=${encodeURIComponent(keyword)}&t=all`, {
      responseType: 'arraybuffer'
    })

    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(response.data)
    const match = text.match(/v_hint="([^"]+)"/)
    if (!match) return []

    const clean = text
      .replace(/^v_hint="/, '')
      .replace(/"$/, '')

    return clean.split('^').map(item => {
      const [market, code, name, pinyin, type] = item.split('~')

      return {
        market: marketMap[market.toUpperCase() as keyof typeof marketMap],
        symbol: code,
        name: decodeUnicode(name),
        pinyin,
        type
      }
    })
  } catch (error) {
    console.error('Main process stock search failed:', error)
    return []
  }
})

function decodeUnicode(str: string) {
  return JSON.parse('"' + str.replace(/"/g, '\\"') + '"')
}

export const marketMap = {
  US: '美国',
  CN: '中国',
  HK: '中国香港',
  TW: '中国台湾',
  JP: '日本',
  KR: '韩国',
  SG: '新加坡',
  UK: '英国',
  DE: '德国',
  FR: '法国',
  AU: '澳大利亚',
  CA: '加拿大',
  IN: '印度',
  BR: '巴西',
  RU: '俄罗斯',
};