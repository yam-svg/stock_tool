import Database from 'better-sqlite3'
import * as path from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

/**
 * 初始化数据库
 */
export function initializeDatabase() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'stocklite.db')
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

