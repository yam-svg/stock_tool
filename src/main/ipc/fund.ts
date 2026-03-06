import { ipcMain } from 'electron'
import { generateId } from '../../shared/utils'
import { getDatabase } from '../database'

/**
 * 基金分组 IPC handlers
 */
export function registerFundGroupHandlers() {
  ipcMain.handle('db-create-fund-group', async (_event, name: string) => {
    const db = getDatabase()
    const id = generateId()
    const createdAt = Date.now()

    const stmt = db.prepare('INSERT INTO fund_groups (id, name, created_at) VALUES (?, ?, ?)')
    stmt.run(id, name, createdAt)

    return { id, name, createdAt }
  })

  ipcMain.handle('db-get-fund-groups', async () => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM fund_groups ORDER BY created_at')
    return stmt.all()
  })

  ipcMain.handle('db-update-fund-group', async (_event, id: string, name: string) => {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE fund_groups SET name = ? WHERE id = ?')
    stmt.run(name, id)
  })

  ipcMain.handle('db-delete-fund-group', async (_event, id: string) => {
    const db = getDatabase()
    // 先删除组内基金
    const deleteFundsStmt = db.prepare('DELETE FROM funds WHERE group_id = ?')
    deleteFundsStmt.run(id)
    // 再删除分组
    const stmt = db.prepare('DELETE FROM fund_groups WHERE id = ?')
    stmt.run(id)
  })
}

/**
 * 基金持仓 IPC handlers
 */
export function registerFundHandlers() {
  ipcMain.handle('db-create-fund', async (_event, fund: any) => {
    const db = getDatabase()
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
    const db = getDatabase()
    let stmt
    if (groupId) {
      stmt = db.prepare(
        'SELECT id, code, name, group_id AS groupId, cost_nav AS costNav, shares, created_at AS createdAt, sort_order AS sortOrder FROM funds WHERE group_id = ? ORDER BY sort_order, created_at'
      )
      return stmt.all(groupId)
    } else {
      stmt = db.prepare(
        'SELECT id, code, name, group_id AS groupId, cost_nav AS costNav, shares, created_at AS createdAt, sort_order AS sortOrder FROM funds ORDER BY sort_order, created_at'
      )
      return stmt.all()
    }
  })

  ipcMain.handle('db-update-fund', async (_event, id: string, updates: any) => {
    const db = getDatabase()
    const updateFields = Object.keys(updates)
      .map(key => {
        if (key === 'groupId') return 'group_id = ?'
        if (key === 'costNav') return 'cost_nav = ?'
        if (key === 'sortOrder') return 'sort_order = ?'
        return `${key} = ?`
      })
      .join(', ')

    const values = Object.keys(updates).map(key => updates[key])
    values.push(id)

    const stmt = db.prepare(`UPDATE funds SET ${updateFields} WHERE id = ?`)
    stmt.run(...values)
  })

  ipcMain.handle('db-delete-fund', async (_event, id: string) => {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM funds WHERE id = ?')
    stmt.run(id)
  })
  
  // 批量更新基金排序
  ipcMain.handle('db-update-funds-sort-order', async (_event, updates: Array<{ id: string; sortOrder: number }>) => {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE funds SET sort_order = ? WHERE id = ?')
    
    const transaction = db.transaction(() => {
      for (const update of updates) {
        stmt.run(update.sortOrder, update.id)
      }
    })
    
    transaction()
  })
}

/**
 * 注册所有基金相关的 IPC handlers
 */
export function registerAllFundHandlers() {
  registerFundGroupHandlers()
  registerFundHandlers()
}

