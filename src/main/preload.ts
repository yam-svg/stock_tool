import { contextBridge, ipcRenderer } from 'electron'
import { DatabaseAPI } from '../shared/types'

//API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    // 分组操作
    createStockGroup: (name: string) => ipcRenderer.invoke('db-create-stock-group', name),
    createFundGroup: (name: string) => ipcRenderer.invoke('db-create-fund-group', name),
    getStockGroups: () => ipcRenderer.invoke('db-get-stock-groups'),
    getFundGroups: () => ipcRenderer.invoke('db-get-fund-groups'),
    updateStockGroup: (id: string, name: string) => ipcRenderer.invoke('db-update-stock-group', id, name),
    updateFundGroup: (id: string, name: string) => ipcRenderer.invoke('db-update-fund-group', id, name),
    deleteStockGroup: (id: string) => ipcRenderer.invoke('db-delete-stock-group', id),
    deleteFundGroup: (id: string) => ipcRenderer.invoke('db-delete-fund-group', id),
    
    //股票操作
    createStock: (stock: any) => ipcRenderer.invoke('db-create-stock', stock),
    getStocks: (groupId?: string) => ipcRenderer.invoke('db-get-stocks', groupId),
    updateStock: (id: string, updates: any) => ipcRenderer.invoke('db-update-stock', id, updates),
    deleteStock: (id: string) => ipcRenderer.invoke('db-delete-stock', id),
    
    //基操作
    createFund: (fund: any) => ipcRenderer.invoke('db-create-fund', fund),
    getFunds: (groupId?: string) => ipcRenderer.invoke('db-get-funds', groupId),
    updateFund: (id: string, updates: any) => ipcRenderer.invoke('db-update-fund', id, updates),
    deleteFund: (id: string) => ipcRenderer.invoke('db-delete-fund', id),
    
    //行数据
    getStockQuotes: (symbols: string[]) => ipcRenderer.invoke('db-get-stock-quotes', symbols),
    getFundQuotes: (codes: string[]) => ipcRenderer.invoke('db-get-fund-quotes', codes),
    
    //搜索
    searchStocks: (keyword: string) => ipcRenderer.invoke('stock-search', keyword),
  } as DatabaseAPI,
  platform: process.platform,
})