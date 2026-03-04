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
      // 如果已经有前缀则保持原样
      if (/^[a-z]{2}[0-9]+/.test(s)) return s.toLowerCase();
      // 否则根据数字开头猜测
      if (/^[0-9]{6}$/.test(s)) {
        if (s.startsWith('6') || s.startsWith('5')) return `sh${s}`
        if (s.startsWith('0') || s.startsWith('3') || s.startsWith('1')) return `sz${s}`
      }
      return s.toLowerCase()
    })
    
    const q = fullSymbols.join(',')
    const response = await axios.get(`http://hq.sinajs.cn/list=${q}`, {
      headers: {
        'Referer': 'http://finance.sina.com.cn'
      },
      responseType: 'arraybuffer'
    })
    
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(response.data)
    const lines = text.split('\n').filter(line => line.trim())
    
    return lines.map(line => {
      // var hq_str_sh600519="贵州茅台,1710.00,1711.00,1710.00,1715.00,1700.00,1710.00,1710.05,..."
      const match = line.match(/var hq_str_([^=]+)="([^"]+)"/)
      if (!match) return null

      const symbol = match[1]
      const data = match[2].split(',')
      if (data.length < 4) return null;
      
      const name = data[0]
      const preClose = parseFloat(data[2])
      const price = parseFloat(data[3])
      
      const change = price !== 0 ? price - preClose : 0
      const changePercent = preClose !== 0 ? (change / preClose) * 100 : 0
      
      return {
        symbol,
        name,
        price: price || preClose || 0,
        change,
        changePercent,
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
    // 新浪场外基金前缀为 fund_
    const q = codes.map(c => `fund_${c}`).join(',')
    const response = await axios.get(`http://hq.sinajs.cn/list=${q}`, {
      headers: {
        'Referer': 'http://finance.sina.com.cn'
      },
      responseType: 'arraybuffer'
    })
    
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(response.data)
    const lines = text.split('\n').filter(line => line.trim())
    
    return lines.map(line => {
      // var hq_str_fund_000001="华夏成长混合,1.2356,1.2356,1.2356,2024-01-01,..."
      const match = line.match(/var hq_str_fund_([^=]+)="([^"]+)"/)
      if (!match) return null

      const code = match[1]
      const data = match[2].split(',')
      if (data.length < 4) return null;
      
      const name = data[0]
      const nav = parseFloat(data[1]) // 当前净值
      const preNav = parseFloat(data[2]) // 昨日净值
      
      const change = nav !== 0 ? nav - preNav : 0
      const changePercent = preNav !== 0 ? (change / preNav) * 100 : 0
      
      return {
        code,
        name,
        nav: nav || preNav || 0,
        change,
        changePercent,
        date: data[4]
      }
    }).filter(quote => quote !== null)
  } catch (error) {
    console.error('Main process fetch fund quotes failed:', error)
    return []
  }
})

ipcMain.handle('fund-search', async (_event, keyword: string) => {
  if (!keyword.trim()) return []

  try {
    const response = await axios.get('https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx', {
      params: {
        m: 1,
        key: keyword
      }
    })

    const data = response.data as { Datas?: Array<{ CODE: string; NAME: string }> }
    const list = data?.Datas || []

    return list.map(item => ({
      code: item.CODE,
      name: item.NAME,
      ...item
    }))
  } catch (error) {
    console.error('Main process fund search failed:', error)
    return []
  }
})

ipcMain.handle('stock-search', async (_event, keyword: string) => {
  if (!keyword.trim()) return []
  
  try {
    const response = await axios.get(`https://suggest3.sinajs.cn/suggest/key=${encodeURIComponent(keyword)}`, {
      responseType: 'arraybuffer'
    })
    
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(response.data)
    
    // var suggestdata_1710000000000 = "贵州茅台,11,600519,sh600519,贵州茅台,,贵州茅台,99;..."
    const match = text.match(/"([^"]+)"/)
    if (!match) return []

    const items = match[1].split(';')
    return items.map(item => {
      const parts = item.split(',')
      // parts[0]: name, parts[2]: code, parts[3]: fullSymbol
      return {
        symbol: parts[3] || parts[2],
        name: parts[0]
      }
    }).filter(item => item.symbol && item.name)
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