import { useEffect } from 'react'
import { RefreshConfig } from '../../shared/types'

interface UseAppLifecycleParams {
  initialize: () => Promise<void>
  refreshConfig: RefreshConfig
  refreshStockQuotes: () => Promise<void>
  refreshFundQuotes: () => Promise<void>
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

export function useAppLifecycle({
  initialize,
  refreshConfig,
  refreshStockQuotes,
  refreshFundQuotes,
  sidebarCollapsed,
  setSidebarCollapsed,
}: UseAppLifecycleParams) {
  // 应用首次挂载时执行全局初始化（配置 + 数据）。
  useEffect(() => {
    initialize()
  }, [initialize])

  // 根据刷新配置启动/停止定时器，避免在组件层重复管理。
  useEffect(() => {
    if (!refreshConfig.enabled) return

    const stockTimer = setInterval(() => {
      void refreshStockQuotes()
    }, refreshConfig.stockInterval)

    const fundTimer = setInterval(() => {
      void refreshFundQuotes()
    }, refreshConfig.fundInterval)

    return () => {
      clearInterval(stockTimer)
      clearInterval(fundTimer)
    }
  }, [
    refreshConfig.enabled,
    refreshConfig.stockInterval,
    refreshConfig.fundInterval,
    refreshStockQuotes,
    refreshFundQuotes,
  ])

  // 响应式规则：窄屏自动收起，宽屏自动展开。
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 1024 && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      } else if (width >= 1280 && sidebarCollapsed) {
        setSidebarCollapsed(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarCollapsed, setSidebarCollapsed])
}
