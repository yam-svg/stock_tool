import { ipcMain } from 'electron'
import { generateId } from '../../shared/utils'
import { getDatabase } from '../database'
import {
  ALL_STOCK_GROUP_ID,
  HOLDING_STOCK_GROUP_ID,
  isSystemStockGroup,
} from '../../shared/groupConstants'

/**
 * 股票分组 IPC handlers
 */
export function registerStockGroupHandlers() {
  ipcMain.handle('db-create-stock-group', async (_event, name: string) => {
    const db = getDatabase()
    const id = generateId()
    const createdAt = Date.now()

    const stmt = db.prepare('INSERT INTO stock_groups (id, name, created_at) VALUES (?, ?, ?)')
    stmt.run(id, name, createdAt)

    return { id, name, createdAt }
  })

  ipcMain.handle('db-get-stock-groups', async () => {
    const db = getDatabase()
    const stmt = db.prepare(
      `SELECT *
       FROM stock_groups
       ORDER BY CASE WHEN id = ? THEN 0 WHEN id = ? THEN 1 ELSE 2 END, created_at`
    )
    return stmt.all(ALL_STOCK_GROUP_ID, HOLDING_STOCK_GROUP_ID)
  })

  ipcMain.handle('db-update-stock-group', async (_event, id: string, name: string) => {
    if (isSystemStockGroup(id)) return
    const db = getDatabase()
    const stmt = db.prepare('UPDATE stock_groups SET name = ? WHERE id = ?')
    stmt.run(name, id)
  })

  ipcMain.handle('db-delete-stock-group', async (_event, id: string) => {
    if (isSystemStockGroup(id)) return
    const db = getDatabase()
    // 先删除组内股票
    const deleteStocksStmt = db.prepare('DELETE FROM stocks WHERE group_id = ?')
    deleteStocksStmt.run(id)
    // 再删除分组
    const stmt = db.prepare('DELETE FROM stock_groups WHERE id = ?')
    stmt.run(id)
  })
}

/**
 * 股票持仓 IPC handlers
 */
export function registerStockHandlers() {
  ipcMain.handle('db-create-stock', async (_event, stock: any) => {
    const db = getDatabase()
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
    const db = getDatabase()
    let stmt
    if (groupId) {
      stmt = db.prepare(
        'SELECT id, symbol, name, group_id AS groupId, cost_price AS costPrice, quantity, created_at AS createdAt, sort_order AS sortOrder FROM stocks WHERE group_id = ? ORDER BY sort_order, created_at'
      )
      return stmt.all(groupId)
    } else {
      stmt = db.prepare(
        'SELECT id, symbol, name, group_id AS groupId, cost_price AS costPrice, quantity, created_at AS createdAt, sort_order AS sortOrder FROM stocks ORDER BY sort_order, created_at'
      )
      return stmt.all()
    }
  })

  ipcMain.handle('db-update-stock', async (_event, id: string, updates: any) => {
    const db = getDatabase()
    const updateFields = Object.keys(updates)
      .map(key => {
        if (key === 'groupId') return 'group_id = ?'
        if (key === 'costPrice') return 'cost_price = ?'
        if (key === 'sortOrder') return 'sort_order = ?'
        return `${key} = ?`
      })
      .join(', ')

    const values = Object.keys(updates).map(key => updates[key])
    values.push(id)

    const stmt = db.prepare(`UPDATE stocks SET ${updateFields} WHERE id = ?`)
    stmt.run(...values)
  })

  ipcMain.handle('db-delete-stock', async (_event, id: string) => {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM stocks WHERE id = ?')
    stmt.run(id)
  })
  
  // 批量更新股票排序
  ipcMain.handle('db-update-stocks-sort-order', async (_event, updates: Array<{ id: string; sortOrder: number }>) => {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE stocks SET sort_order = ? WHERE id = ?')
    
    const transaction = db.transaction(() => {
      for (const update of updates) {
        stmt.run(update.sortOrder, update.id)
      }
    })
    
    transaction()
  })
}

/**
 * 注册所有股票相关的 IPC handlers
 */
export function registerAllStockHandlers() {
  registerStockGroupHandlers()
  registerStockHandlers()
}

