"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
//API给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    db: {
        // 分组操作
        createStockGroup: (name) => electron_1.ipcRenderer.invoke('db-create-stock-group', name),
        createFundGroup: (name) => electron_1.ipcRenderer.invoke('db-create-fund-group', name),
        getStockGroups: () => electron_1.ipcRenderer.invoke('db-get-stock-groups'),
        getFundGroups: () => electron_1.ipcRenderer.invoke('db-get-fund-groups'),
        updateStockGroup: (id, name) => electron_1.ipcRenderer.invoke('db-update-stock-group', id, name),
        updateFundGroup: (id, name) => electron_1.ipcRenderer.invoke('db-update-fund-group', id, name),
        deleteStockGroup: (id) => electron_1.ipcRenderer.invoke('db-delete-stock-group', id),
        deleteFundGroup: (id) => electron_1.ipcRenderer.invoke('db-delete-fund-group', id),
        //股票操作
        createStock: (stock) => electron_1.ipcRenderer.invoke('db-create-stock', stock),
        getStocks: (groupId) => electron_1.ipcRenderer.invoke('db-get-stocks', groupId),
        updateStock: (id, updates) => electron_1.ipcRenderer.invoke('db-update-stock', id, updates),
        deleteStock: (id) => electron_1.ipcRenderer.invoke('db-delete-stock', id),
        //基操作
        createFund: (fund) => electron_1.ipcRenderer.invoke('db-create-fund', fund),
        getFunds: (groupId) => electron_1.ipcRenderer.invoke('db-get-funds', groupId),
        updateFund: (id, updates) => electron_1.ipcRenderer.invoke('db-update-fund', id, updates),
        deleteFund: (id) => electron_1.ipcRenderer.invoke('db-delete-fund', id),
        //行数据
        getStockQuotes: (symbols) => electron_1.ipcRenderer.invoke('db-get-stock-quotes', symbols),
        getFundQuotes: (codes) => electron_1.ipcRenderer.invoke('db-get-fund-quotes', codes),
    },
    platform: process.platform,
});
