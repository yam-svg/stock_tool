import { contextBridge, ipcRenderer } from 'electron'
import { DatabaseAPI } from '../shared/types'

//API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    // 分组操作
    createStockGroup: (name: string) => ipcRenderer.invoke('db-create-stock-group', name),
    createFundGroup: (name: string) => ipcRenderer.invoke('db-create-fund-group', name),
    createFutureGroup: (name: string) => ipcRenderer.invoke('db-create-future-group', name),
    getStockGroups: () => ipcRenderer.invoke('db-get-stock-groups'),
    getFundGroups: () => ipcRenderer.invoke('db-get-fund-groups'),
    getFutureGroups: () => ipcRenderer.invoke('db-get-future-groups'),
    updateStockGroup: (id: string, name: string) => ipcRenderer.invoke('db-update-stock-group', id, name),
    updateFundGroup: (id: string, name: string) => ipcRenderer.invoke('db-update-fund-group', id, name),
    updateFutureGroup: (id: string, name: string) => ipcRenderer.invoke('db-update-future-group', id, name),
    deleteStockGroup: (id: string) => ipcRenderer.invoke('db-delete-stock-group', id),
    deleteFundGroup: (id: string) => ipcRenderer.invoke('db-delete-fund-group', id),
    deleteFutureGroup: (id: string) => ipcRenderer.invoke('db-delete-future-group', id),
    
    //股票操作
    createStock: (stock: any) => ipcRenderer.invoke('db-create-stock', stock),
    getStocks: (groupId?: string) => ipcRenderer.invoke('db-get-stocks', groupId),
    updateStock: (id: string, updates: any) => ipcRenderer.invoke('db-update-stock', id, updates),
    deleteStock: (id: string) => ipcRenderer.invoke('db-delete-stock', id),
    updateStocksSortOrder: (updates: Array<{ id: string; sortOrder: number }>) =>
      ipcRenderer.invoke('db-update-stocks-sort-order', updates),
    
    //基操作
    createFund: (fund: any) => ipcRenderer.invoke('db-create-fund', fund),
    getFunds: (groupId?: string) => ipcRenderer.invoke('db-get-funds', groupId),
    updateFund: (id: string, updates: any) => ipcRenderer.invoke('db-update-fund', id, updates),
    deleteFund: (id: string) => ipcRenderer.invoke('db-delete-fund', id),
    updateFundsSortOrder: (updates: Array<{ id: string; sortOrder: number }>) =>
      ipcRenderer.invoke('db-update-funds-sort-order', updates),

    //期货操作
    createFuture: (future: any) => ipcRenderer.invoke('db-create-future', future),
    getFutures: (groupId?: string) => ipcRenderer.invoke('db-get-futures', groupId),
    updateFuture: (id: string, updates: any) => ipcRenderer.invoke('db-update-future', id, updates),
    deleteFuture: (id: string) => ipcRenderer.invoke('db-delete-future', id),
    updateFuturesSortOrder: (updates: Array<{ id: string; sortOrder: number }>) =>
      ipcRenderer.invoke('db-update-futures-sort-order', updates),
    
    //行数据
    getStockQuotes: (symbols: string[]) => ipcRenderer.invoke('db-get-stock-quotes', symbols),
    getFundQuotes: (codes: string[]) => ipcRenderer.invoke('db-get-fund-quotes', codes),
    getFutureQuotes: (symbols: string[]) => ipcRenderer.invoke('db-get-future-quotes', symbols),
    getGlobalIndexQuotes: () => ipcRenderer.invoke('db-get-global-index-quotes'),
    getStockIntraday: (symbol: string) => ipcRenderer.invoke('db-get-stock-intraday', symbol),
    
    //搜索
    searchStocks: (keyword: string) => ipcRenderer.invoke('stock-search', keyword),
    searchFunds: (keyword: string) => ipcRenderer.invoke('fund-search', keyword),
    searchFutures: (keyword: string) => ipcRenderer.invoke('future-search', keyword),
  } as DatabaseAPI,
  platform: process.platform,
})