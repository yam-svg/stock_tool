import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import {
  ALL_FUND_GROUP_ID,
  ALL_FUND_GROUP_NAME,
  ALL_FUTURE_GROUP_ID,
  ALL_FUTURE_GROUP_NAME,
  ALL_STOCK_GROUP_ID,
  ALL_STOCK_GROUP_NAME,
  HOLDING_FUND_GROUP_ID,
  HOLDING_FUND_GROUP_NAME,
  HOLDING_FUTURE_GROUP_ID,
  HOLDING_FUTURE_GROUP_NAME,
  HOLDING_STOCK_GROUP_ID,
  HOLDING_STOCK_GROUP_NAME,
} from '../../shared/groupConstants'

let db: Database.Database | null = null

function getHoldingRowCount(dbPath: string) {
  if (!fs.existsSync(dbPath)) return 0

  let tempDb: Database.Database | null = null
  try {
    tempDb = new Database(dbPath, { readonly: true, fileMustExist: true })
    const hasTable = (tableName: string) => {
      const row = tempDb!
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
        .get(tableName)
      return !!row
    }

    const countRows = (tableName: string) => {
      if (!hasTable(tableName)) return 0
      const row = tempDb!.prepare(`SELECT COUNT(1) as count FROM ${tableName}`).get() as { count?: number }
      return Number(row?.count || 0)
    }

    return countRows('stocks') + countRows('funds') + countRows('futures')
  } catch {
    return 0
  } finally {
    if (tempDb) tempDb.close()
  }
}

function hasMeaningfulData(dbPath: string) {
  return getHoldingRowCount(dbPath) > 0
}

function tryMigrateLegacyDatabase(targetDbPath: string) {
  if (hasMeaningfulData(targetDbPath)) return

  const userDataDir = path.dirname(targetDbPath)
  const appDataDir = app.getPath('appData')
  const legacyDirs = [
    userDataDir,
    path.join(appDataDir, 'Stock666'),
    path.join(appDataDir, 'stock666'),
    path.join(appDataDir, 'my-electron-app'),
  ]

  const preferredDbNames = ['stocklite.db', 'stock666.db', 'stocks.db', 'database.db']

  const pickLegacyDb = (dir: string) => {
    if (!fs.existsSync(dir)) return ''

    const candidates = new Set<string>()
    for (const fileName of preferredDbNames) {
      const fullPath = path.join(dir, fileName)
      if (fs.existsSync(fullPath)) candidates.add(fullPath)
    }

    fs
      .readdirSync(dir)
      .filter((name) => name.toLowerCase().endsWith('.db'))
      .forEach((name) => candidates.add(path.join(dir, name)))

    const ranked = Array.from(candidates)
      .filter((fullPath) => fullPath !== targetDbPath)
      .map((fullPath) => ({
        fullPath,
        hasData: hasMeaningfulData(fullPath),
        size: fs.statSync(fullPath).size,
      }))
      .sort((a, b) => {
        if (a.hasData !== b.hasData) return a.hasData ? -1 : 1
        return b.size - a.size
      })

    return ranked[0]?.fullPath || ''
  }

  for (const legacyDir of legacyDirs) {
    const sourceDbPath = pickLegacyDb(legacyDir)
    if (!sourceDbPath) continue

    try {
      fs.mkdirSync(userDataDir, { recursive: true })

      if (fs.existsSync(targetDbPath)) {
        const backupPath = `${targetDbPath}.${Date.now()}.bak`
        fs.renameSync(targetDbPath, backupPath)
      }

      fs.copyFileSync(sourceDbPath, targetDbPath)

      const sidecars = ['-wal', '-shm']
      sidecars.forEach((suffix) => {
        const sourceSidecar = `${sourceDbPath}${suffix}`
        const targetSidecar = `${targetDbPath}${suffix}`
        if (fs.existsSync(sourceSidecar) && !fs.existsSync(targetSidecar)) {
          fs.copyFileSync(sourceSidecar, targetSidecar)
        }
      })

      console.log(`Migrated legacy database from ${sourceDbPath} to ${targetDbPath}`)
      return
    } catch (error) {
      console.warn(`Failed to migrate legacy database from ${sourceDbPath}:`, error)
    }
  }
}

/**
 * 初始化数据库
 */
export function initializeDatabase() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'stocklite.db')
    tryMigrateLegacyDatabase(dbPath)
    db = new Database(dbPath)

    // 创建股票分组表
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
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (group_id) REFERENCES stock_groups (id)
      )
    `)

    // 创建基金分组表
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
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (group_id) REFERENCES fund_groups (id)
      )
    `)

        // 创建期货分组表
        db.exec(`
          CREATE TABLE IF NOT EXISTS future_groups (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at INTEGER NOT NULL
          )
        `)

        // 创建期货表
        db.exec(`
          CREATE TABLE IF NOT EXISTS futures (
            id TEXT PRIMARY KEY,
            symbol TEXT NOT NULL,
            name TEXT NOT NULL,
            group_id TEXT NOT NULL,
            entry_price REAL NOT NULL,
            quantity REAL NOT NULL,
                direction TEXT NOT NULL DEFAULT 'long',
            created_at INTEGER NOT NULL,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (group_id) REFERENCES future_groups (id)
          )
        `)

    // 迁移逻辑：如果表已存在但没有 sort_order 列，则添加
    try {
      db.exec(`ALTER TABLE stocks ADD COLUMN sort_order INTEGER DEFAULT 0`)
    } catch (e) {
      // 列已存在，忽略错误
    }
    
    try {
      db.exec(`ALTER TABLE funds ADD COLUMN sort_order INTEGER DEFAULT 0`)
    } catch (e) {
      // 列已存在，忽略错误
    }

    try {
      db.exec(`ALTER TABLE futures ADD COLUMN sort_order INTEGER DEFAULT 0`)
    } catch (e) {
      // 列已存在，忽略错误
    }

    try {
      db.exec(`ALTER TABLE futures ADD COLUMN direction TEXT NOT NULL DEFAULT 'long'`)
    } catch (e) {
      // 列已存在，忽略错误
    }

    // 保证系统分组存在且名称正确，旧数据升级时自动补齐。
    const upsertStockSystemGroupStmt = db.prepare(
      `INSERT INTO stock_groups (id, name, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name`
    )
    const upsertFundSystemGroupStmt = db.prepare(
      `INSERT INTO fund_groups (id, name, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name`
    )
    const upsertFutureSystemGroupStmt = db.prepare(
      `INSERT INTO future_groups (id, name, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name`
    )

    const now = Date.now()
    upsertStockSystemGroupStmt.run(ALL_STOCK_GROUP_ID, ALL_STOCK_GROUP_NAME, now)
    upsertStockSystemGroupStmt.run(HOLDING_STOCK_GROUP_ID, HOLDING_STOCK_GROUP_NAME, now)
    upsertFundSystemGroupStmt.run(ALL_FUND_GROUP_ID, ALL_FUND_GROUP_NAME, now)
    upsertFundSystemGroupStmt.run(HOLDING_FUND_GROUP_ID, HOLDING_FUND_GROUP_NAME, now)
    upsertFutureSystemGroupStmt.run(ALL_FUTURE_GROUP_ID, ALL_FUTURE_GROUP_NAME, now)
    upsertFutureSystemGroupStmt.run(HOLDING_FUTURE_GROUP_ID, HOLDING_FUTURE_GROUP_NAME, now)

    // 升级兼容：把无效分组引用回收到系统分组，避免“看不见持仓”。
    db.prepare(
      `UPDATE stocks
       SET group_id = ?
       WHERE group_id NOT IN (SELECT id FROM stock_groups)`
    ).run(ALL_STOCK_GROUP_ID)

    db.prepare(
      `UPDATE funds
       SET group_id = ?
       WHERE group_id NOT IN (SELECT id FROM fund_groups)`
    ).run(ALL_FUND_GROUP_ID)

    db.prepare(
      `UPDATE futures
       SET group_id = ?
       WHERE group_id NOT IN (SELECT id FROM future_groups)`
    ).run(ALL_FUTURE_GROUP_ID)

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
  }
}

/**
 * 获取数据库实例
 */
export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

/**
 * 关闭数据库
 */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

