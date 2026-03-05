/**
 * 根Store - 组合所有子Store
 * 为了向后兼容性，这里提供了统一的useStore接口
 */
import { useUIStore } from './uiStore'
import { useStockStore } from './stockStore'
import { useFundStore } from './fundStore'
import { useRefreshStore } from './refreshStore'

/**
 * 合并所有Store为一个统一接口
 * 允许代码继续使用 useStore() 调用
 */
export const useStore = () => {
  const uiStore = useUIStore()
  const stockStore = useStockStore()
  const fundStore = useFundStore()
  const refreshStore = useRefreshStore()

  return {
    // UI Store
    activeTab: uiStore.activeTab,
    darkMode: uiStore.darkMode,
    stockViewMode: uiStore.stockViewMode,
    fundViewMode: uiStore.fundViewMode,
    sidebarCollapsed: uiStore.sidebarCollapsed,
    setActiveTab: uiStore.setActiveTab,
    toggleDarkMode: uiStore.toggleDarkMode,
    setStockViewMode: uiStore.setStockViewMode,
    setFundViewMode: uiStore.setFundViewMode,
    toggleSidebar: uiStore.toggleSidebar,
    setSidebarCollapsed: uiStore.setSidebarCollapsed,

    // Refresh Store
    refreshConfig: refreshStore.refreshConfig,
    setRefreshConfig: refreshStore.setRefreshConfig,
    toggleRefresh: refreshStore.toggleRefresh,

    // Stock Store
    stockGroups: stockStore.stockGroups,
    stocks: stockStore.stocks,
    stockQuotes: stockStore.stockQuotes,
    selectedStockGroup: stockStore.selectedStockGroup,
    createStockGroup: stockStore.createStockGroup,
    selectStockGroup: stockStore.selectStockGroup,
    updateStockGroup: stockStore.updateStockGroup,
    deleteStockGroup: stockStore.deleteStockGroup,
    addStock: stockStore.addStock,
    updateStock: stockStore.updateStock,
    deleteStock: stockStore.deleteStock,
    moveStockToGroup: stockStore.moveStockToGroup,
    refreshStockQuotes: stockStore.refreshStockQuotes,

    // Fund Store
    fundGroups: fundStore.fundGroups,
    funds: fundStore.funds,
    fundQuotes: fundStore.fundQuotes,
    selectedFundGroup: fundStore.selectedFundGroup,
    createFundGroup: fundStore.createFundGroup,
    selectFundGroup: fundStore.selectFundGroup,
    updateFundGroup: fundStore.updateFundGroup,
    deleteFundGroup: fundStore.deleteFundGroup,
    addFund: fundStore.addFund,
    updateFund: fundStore.updateFund,
    deleteFund: fundStore.deleteFund,
    moveFundToGroup: fundStore.moveFundToGroup,
    refreshFundQuotes: fundStore.refreshFundQuotes,

    // 全局加载状态和错误
    loading: stockStore.loading || fundStore.loading || refreshStore.loading,
    error: stockStore.error || fundStore.error || refreshStore.error,
    clearError: () => {
      stockStore.clearError()
      fundStore.clearError()
      refreshStore.clearError()
    },

    // 全局初始化
    initialize: async () => {
      await Promise.all([
        refreshStore.initialize(),
        stockStore.initialize(),
        fundStore.initialize(),
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
  if (savedSidebarCollapsed !== uiStore.sidebarCollapsed) {
    uiStore.setSidebarCollapsed(savedSidebarCollapsed)
  }
}

// 直接导出子Store以便需要时单独使用
export { useUIStore, useStockStore, useFundStore, useRefreshStore }
