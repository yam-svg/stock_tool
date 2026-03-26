/**
 * 根Store - 组合所有子Store
 * 为了向后兼容性，这里提供了统一的useStore接口
 */
import { useUIStore } from './uiStore'
import { useStockStore } from './stockStore'
import { useFundStore } from './fundStore'
import { useFutureStore } from './futureStore'
import { useRefreshStore } from './refreshStore'
import { useGlobalMarketStore } from './globalMarketStore'

/**
 * 合并所有Store为一个统一接口
 * 允许代码继续使用 useStore() 调用
 */
export const useStore = () => {
  const uiStore = useUIStore()
  const stockStore = useStockStore()
  const fundStore = useFundStore()
  const futureStore = useFutureStore()
  const refreshStore = useRefreshStore()
  const globalMarketStore = useGlobalMarketStore()

  return {
    // UI Store
    activeTab: uiStore.activeTab,
    darkMode: uiStore.darkMode,
    stockViewMode: uiStore.stockViewMode,
    fundViewMode: uiStore.fundViewMode,
    futureViewMode: uiStore.futureViewMode,
    globalViewMode: uiStore.globalViewMode,
    sidebarCollapsed: uiStore.sidebarCollapsed,
    setActiveTab: uiStore.setActiveTab,
    toggleDarkMode: uiStore.toggleDarkMode,
    setStockViewMode: uiStore.setStockViewMode,
    setFundViewMode: uiStore.setFundViewMode,
    setFutureViewMode: uiStore.setFutureViewMode,
    setGlobalViewMode: uiStore.setGlobalViewMode,
    toggleSidebar: uiStore.toggleSidebar,
    setSidebarCollapsed: uiStore.setSidebarCollapsed,

    // Refresh Store
    refreshConfig: refreshStore.refreshConfig,
    setRefreshConfig: refreshStore.setRefreshConfig,
    toggleRefresh: refreshStore.toggleRefresh,
    isMarketOpen: refreshStore.isMarketOpen,
    nextMarketOpenTime: refreshStore.nextMarketOpenTime,

    // Stock Store
    stockGroups: stockStore.stockGroups,
    stocks: stockStore.stocks,
    stockQuotes: stockStore.stockQuotes,
    selectedStockGroup: stockStore.selectedStockGroup,
    stockRefreshing: stockStore.refreshing,
    createStockGroup: stockStore.createStockGroup,
    selectStockGroup: stockStore.selectStockGroup,
    updateStockGroup: stockStore.updateStockGroup,
    deleteStockGroup: stockStore.deleteStockGroup,
    addStock: stockStore.addStock,
    updateStock: stockStore.updateStock,
    deleteStock: stockStore.deleteStock,
    moveStockToGroup: stockStore.moveStockToGroup,
    reorderStocks: stockStore.reorderStocks,
    refreshStockQuotes: stockStore.refreshStockQuotes,

    // Fund Store
    fundGroups: fundStore.fundGroups,
    funds: fundStore.funds,
    fundQuotes: fundStore.fundQuotes,
    selectedFundGroup: fundStore.selectedFundGroup,
    fundRefreshing: fundStore.refreshing,
    createFundGroup: fundStore.createFundGroup,
    selectFundGroup: fundStore.selectFundGroup,
    updateFundGroup: fundStore.updateFundGroup,
    deleteFundGroup: fundStore.deleteFundGroup,
    addFund: fundStore.addFund,
    updateFund: fundStore.updateFund,
    deleteFund: fundStore.deleteFund,
    moveFundToGroup: fundStore.moveFundToGroup,
    reorderFunds: fundStore.reorderFunds,
    refreshFundQuotes: fundStore.refreshFundQuotes,

    // Future Store
    futureGroups: futureStore.futureGroups,
    futures: futureStore.futures,
    futureQuotes: futureStore.futureQuotes,
    selectedFutureGroup: futureStore.selectedFutureGroup,
    futureRefreshing: futureStore.refreshing,
    createFutureGroup: futureStore.createFutureGroup,
    selectFutureGroup: futureStore.selectFutureGroup,
    updateFutureGroup: futureStore.updateFutureGroup,
    deleteFutureGroup: futureStore.deleteFutureGroup,
    addFuture: futureStore.addFuture,
    updateFuture: futureStore.updateFuture,
    deleteFuture: futureStore.deleteFuture,
    moveFutureToGroup: futureStore.moveFutureToGroup,
    reorderFutures: futureStore.reorderFutures,
    refreshFutureQuotes: futureStore.refreshFutureQuotes,

    // Global Market Store
    globalIndexes: globalMarketStore.globalIndexes,
    globalRefreshing: globalMarketStore.refreshing,
    refreshGlobalIndexes: globalMarketStore.refreshGlobalIndexes,

    // 全局加载状态和错误
    loading: stockStore.loading || fundStore.loading || futureStore.loading || refreshStore.loading || globalMarketStore.loading,
    error: stockStore.error || fundStore.error || futureStore.error || refreshStore.error || globalMarketStore.error,
    clearError: () => {
      stockStore.clearError()
      fundStore.clearError()
      futureStore.clearError()
      refreshStore.clearError()
      globalMarketStore.clearError()
    },

    // 全局初始化
    initialize: async () => {
      await Promise.all([
        refreshStore.initialize(),
        stockStore.initialize(),
        fundStore.initialize(),
        futureStore.initialize(),
        globalMarketStore.initialize(),
      ])
      loadUIConfig()
    }
  }
}

// 加载UI配置
function loadUIConfig() {
  const uiStore = useUIStore.getState()
  const savedDarkMode = localStorage.getItem('darkMode') === 'true'
  const savedStockViewMode = localStorage.getItem('stockViewMode') as 'card' | 'list' | null
  const savedFundViewMode = localStorage.getItem('fundViewMode') as 'card' | 'list' | null
  const savedFutureViewMode = localStorage.getItem('futureViewMode') as 'card' | 'list' | null
  const savedGlobalViewMode = localStorage.getItem('globalViewMode') as 'card' | 'list' | null
  const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'

  if (savedDarkMode && !uiStore.darkMode) {
    uiStore.toggleDarkMode()
  }
  if (savedStockViewMode && savedStockViewMode !== uiStore.stockViewMode) {
    uiStore.setStockViewMode(savedStockViewMode)
  }
  if (savedFundViewMode && savedFundViewMode !== uiStore.fundViewMode) {
    uiStore.setFundViewMode(savedFundViewMode)
  }
  if (savedFutureViewMode && savedFutureViewMode !== uiStore.futureViewMode) {
    uiStore.setFutureViewMode(savedFutureViewMode)
  }
  if (savedGlobalViewMode && savedGlobalViewMode !== uiStore.globalViewMode) {
    uiStore.setGlobalViewMode(savedGlobalViewMode)
  }
  if (savedSidebarCollapsed !== uiStore.sidebarCollapsed) {
    uiStore.setSidebarCollapsed(savedSidebarCollapsed)
  }
}

// 直接导出子Store以便需要时单独使用
export { useUIStore, useStockStore, useFundStore, useFutureStore, useRefreshStore, useGlobalMarketStore }
