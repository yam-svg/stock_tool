import { ipcMain } from 'electron'
import { generateId } from '../../shared/utils'
import { getDatabase } from '../database'
import {
  ALL_FUTURE_GROUP_ID,
  HOLDING_FUTURE_GROUP_ID,
  isSystemFutureGroup,
} from '../../shared/groupConstants'

export function registerFutureGroupHandlers() {
  ipcMain.handle('db-create-future-group', async (_event, name: string) => {
    const db = getDatabase()
    const id = generateId()
    const createdAt = Date.now()

    db.prepare('INSERT INTO future_groups (id, name, created_at) VALUES (?, ?, ?)').run(id, name, createdAt)
    return { id, name, createdAt }
  })

  ipcMain.handle('db-get-future-groups', async () => {
    const db = getDatabase()
    return db
      .prepare(
        `SELECT *
         FROM future_groups
         ORDER BY CASE WHEN id = ? THEN 0 WHEN id = ? THEN 1 ELSE 2 END, created_at`,
      )
      .all(ALL_FUTURE_GROUP_ID, HOLDING_FUTURE_GROUP_ID)
  })

  ipcMain.handle('db-update-future-group', async (_event, id: string, name: string) => {
    if (isSystemFutureGroup(id)) return
    const db = getDatabase()
    db.prepare('UPDATE future_groups SET name = ? WHERE id = ?').run(name, id)
  })

  ipcMain.handle('db-delete-future-group', async (_event, id: string) => {
    if (isSystemFutureGroup(id)) return
    const db = getDatabase()
    db.prepare('DELETE FROM futures WHERE group_id = ?').run(id)
    db.prepare('DELETE FROM future_groups WHERE id = ?').run(id)
  })
}

export function registerFutureHandlers() {
  ipcMain.handle('db-create-future', async (_event, future: any) => {
    const db = getDatabase()
    const id = generateId()
    const createdAt = Date.now()

    db.prepare(
      `INSERT INTO futures (id, symbol, name, group_id, entry_price, quantity, direction, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      future.symbol,
      future.name,
      future.groupId,
      0,
      0,
      'long',
      createdAt,
    )

    return {
      id,
      symbol: future.symbol,
      name: future.name,
      groupId: future.groupId,
      createdAt,
    }
  })

  ipcMain.handle('db-get-futures', async (_event, groupId?: string) => {
    const db = getDatabase()
    if (groupId) {
      return db
        .prepare(
          'SELECT id, symbol, name, group_id AS groupId, created_at AS createdAt, sort_order AS sortOrder FROM futures WHERE group_id = ? ORDER BY sort_order, created_at',
        )
        .all(groupId)
    }

    return db
      .prepare(
        'SELECT id, symbol, name, group_id AS groupId, created_at AS createdAt, sort_order AS sortOrder FROM futures ORDER BY sort_order, created_at',
      )
      .all()
  })

  ipcMain.handle('db-update-future', async (_event, id: string, updates: any) => {
    const db = getDatabase()
    const updateFields = Object.keys(updates)
      .map((key) => {
        if (key === 'groupId') return 'group_id = ?'
        if (key === 'sortOrder') return 'sort_order = ?'
        return `${key} = ?`
      })
      .join(', ')

    const values = Object.keys(updates).map((key) => updates[key])
    values.push(id)

    db.prepare(`UPDATE futures SET ${updateFields} WHERE id = ?`).run(...values)
  })

  ipcMain.handle('db-delete-future', async (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM futures WHERE id = ?').run(id)
  })

  ipcMain.handle('db-update-futures-sort-order', async (_event, updates: Array<{ id: string; sortOrder: number }>) => {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE futures SET sort_order = ? WHERE id = ?')
    const transaction = db.transaction(() => {
      for (const update of updates) {
        stmt.run(update.sortOrder, update.id)
      }
    })
    transaction()
  })
}

export function registerAllFutureHandlers() {
  registerFutureGroupHandlers()
  registerFutureHandlers()
}

