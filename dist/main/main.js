"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const utils_1 = require("../shared/utils");
// 数据库实例
let db = null;
function createWindow() {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }
}
function initializeDatabase() {
    try {
        const dbPath = path.join(electron_1.app.getPath('userData'), 'stocklite.db');
        db = new better_sqlite3_1.default(dbPath);
        //创建分组表
        db.exec(`
      CREATE TABLE IF NOT EXISTS stock_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
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
    `);
        //创建基金分组表
        db.exec(`
      CREATE TABLE IF NOT EXISTS fund_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
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
    `);
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Database initialization failed:', error);
    }
}
electron_1.app.whenReady().then(() => {
    initializeDatabase();
    createWindow();
    electron_1.app.on('activate', function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (db) {
            db.close();
        }
        electron_1.app.quit();
    }
});
// 分组操作IPC handlers
electron_1.ipcMain.handle('db-create-stock-group', async (_event, name) => {
    if (!db)
        throw new Error('Database not initialized');
    const id = (0, utils_1.generateId)();
    const createdAt = Date.now();
    const stmt = db.prepare('INSERT INTO stock_groups (id, name, created_at) VALUES (?, ?, ?)');
    stmt.run(id, name, createdAt);
    return { id, name, createdAt };
});
electron_1.ipcMain.handle('db-create-fund-group', async (_event, name) => {
    if (!db)
        throw new Error('Database not initialized');
    const id = (0, utils_1.generateId)();
    const createdAt = Date.now();
    const stmt = db.prepare('INSERT INTO fund_groups (id, name, created_at) VALUES (?, ?, ?)');
    stmt.run(id, name, createdAt);
    return { id, name, createdAt };
});
electron_1.ipcMain.handle('db-get-stock-groups', async () => {
    if (!db)
        throw new Error('Database not initialized');
    const stmt = db.prepare('SELECT * FROM stock_groups ORDER BY created_at');
    return stmt.all();
});
electron_1.ipcMain.handle('db-get-fund-groups', async () => {
    if (!db)
        throw new Error('Database not initialized');
    const stmt = db.prepare('SELECT * FROM fund_groups ORDER BY created_at');
    return stmt.all();
});
electron_1.ipcMain.handle('db-update-stock-group', async (_event, id, name) => {
    if (!db)
        throw new Error('Database not initialized');
    const stmt = db.prepare('UPDATE stock_groups SET name = ? WHERE id = ?');
    stmt.run(name, id);
});
electron_1.ipcMain.handle('db-update-fund-group', async (_event, id, name) => {
    if (!db)
        throw new Error('Database not initialized');
    const stmt = db.prepare('UPDATE fund_groups SET name = ? WHERE id = ?');
    stmt.run(name, id);
});
electron_1.ipcMain.handle('db-delete-stock-group', async (_event, id) => {
    if (!db)
        throw new Error('Database not initialized');
    //先删除组内股票
    const deleteStocksStmt = db.prepare('DELETE FROM stocks WHERE group_id = ?');
    deleteStocksStmt.run(id);
    //再分组
    const stmt = db.prepare('DELETE FROM stock_groups WHERE id = ?');
    stmt.run(id);
});
electron_1.ipcMain.handle('db-delete-fund-group', async (_event, id) => {
    if (!db)
        throw new Error('Database not initialized');
    //先删除组内基金
    const deleteFundsStmt = db.prepare('DELETE FROM funds WHERE group_id = ?');
    deleteFundsStmt.run(id);
    // 再删除分组
    const stmt = db.prepare('DELETE FROM fund_groups WHERE id = ?');
    stmt.run(id);
});
//操作IPC handlers
electron_1.ipcMain.handle('db-create-stock', async (_event, stock) => {
    if (!db)
        throw new Error('Database not initialized');
    const id = (0, utils_1.generateId)();
    const createdAt = Date.now();
    const stmt = db.prepare(`
    INSERT INTO stocks (id, symbol, name, group_id, cost_price, quantity, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, stock.symbol, stock.name, stock.groupId, stock.costPrice, stock.quantity, createdAt);
    return { id, ...stock, createdAt };
});
electron_1.ipcMain.handle('db-get-stocks', async (_event, groupId) => {
    if (!db)
        throw new Error('Database not initialized');
    let stmt;
    if (groupId) {
        stmt = db.prepare('SELECT * FROM stocks WHERE group_id = ? ORDER BY created_at');
        return stmt.all(groupId);
    }
    else {
        stmt = db.prepare('SELECT * FROM stocks ORDER BY created_at');
        return stmt.all();
    }
});
electron_1.ipcMain.handle('db-update-stock', async (_event, id, updates) => {
    if (!db)
        throw new Error('Database not initialized');
    const fields = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
    const values = Object.values(updates);
    values.push(id);
    const stmt = db.prepare(`UPDATE stocks SET ${fields} WHERE id = ?`);
    stmt.run(...values);
});
electron_1.ipcMain.handle('db-delete-stock', async (_event, id) => {
    if (!db)
        throw new Error('Database not initialized');
    const stmt = db.prepare('DELETE FROM stocks WHERE id = ?');
    stmt.run(id);
});
//基操作IPC handlers
electron_1.ipcMain.handle('db-create-fund', async (_event, fund) => {
    if (!db)
        throw new Error('Database not initialized');
    const id = (0, utils_1.generateId)();
    const createdAt = Date.now();
    const stmt = db.prepare(`
    INSERT INTO funds (id, code, name, group_id, cost_nav, shares, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, fund.code, fund.name, fund.groupId, fund.costNav, fund.shares, createdAt);
    return { id, ...fund, createdAt };
});
electron_1.ipcMain.handle('db-get-funds', async (_event, groupId) => {
    if (!db)
        throw new Error('Database not initialized');
    let stmt;
    if (groupId) {
        stmt = db.prepare('SELECT * FROM funds WHERE group_id = ? ORDER BY created_at');
        return stmt.all(groupId);
    }
    else {
        stmt = db.prepare('SELECT * FROM funds ORDER BY created_at');
        return stmt.all();
    }
});
electron_1.ipcMain.handle('db-update-fund', async (_event, id, updates) => {
    if (!db)
        throw new Error('Database not initialized');
    const fields = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
    const values = Object.values(updates);
    values.push(id);
    const stmt = db.prepare(`UPDATE funds SET ${fields} WHERE id = ?`);
    stmt.run(...values);
});
electron_1.ipcMain.handle('db-delete-fund', async (_event, id) => {
    if (!db)
        throw new Error('Database not initialized');
    const stmt = db.prepare('DELETE FROM funds WHERE id = ?');
    stmt.run(id);
});
//行数据IPC handlers（模拟数据）
electron_1.ipcMain.handle('db-get-stock-quotes', async (_event, symbols) => {
    //模拟股票行情数据
    return symbols.map(symbol => ({
        symbol,
        name: `股票${symbol}`,
        price: Math.random() * 100 + 10,
        change: (Math.random() - 0.5) * 5,
        changePercent: (Math.random() - 0.5) * 0.1,
        updateTime: Date.now()
    }));
});
electron_1.ipcMain.handle('db-get-fund-quotes', async (_event, codes) => {
    //模拟基金行情数据
    return codes.map(code => ({
        code,
        name: `基金${code}`,
        nav: Math.random() * 2 + 0.5,
        change: (Math.random() - 0.5) * 0.1,
        changePercent: (Math.random() - 0.5) * 0.05,
        date: new Date().toISOString().split('T')[0]
    }));
});
