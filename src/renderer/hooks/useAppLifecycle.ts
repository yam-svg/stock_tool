import { useEffect, useRef } from 'react'
import { RefreshConfig } from '../../shared/types'

interface UseAppLifecycleParams {
  initialize: () => Promise<void>
  refreshConfig: RefreshConfig
  refreshStockQuotes: () => Promise<void>
  refreshFundQuotes: () => Promise<void>
  setSidebarCollapsed: (collapsed: boolean) => void
}

export function useAppLifecycle({
  initialize,
  refreshConfig,
  refreshStockQuotes,
  refreshFundQuotes,
  setSidebarCollapsed,
}: UseAppLifecycleParams) {
  const initializedRef = useRef(false)
  const refreshStockQuotesRef = useRef(refreshStockQuotes)
  const refreshFundQuotesRef = useRef(refreshFundQuotes)

  // 保持最新回调引用，避免定时器 effect 因函数引用变化而重复重建。
  useEffect(() => {
    refreshStockQuotesRef.current = refreshStockQuotes
    refreshFundQuotesRef.current = refreshFundQuotes
  }, [refreshStockQuotes, refreshFundQuotes])

  // 仅初始化一次，避免由于上层函数引用变化导致反复初始化卡顿。
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    void initialize()
  }, [initialize])

  // 根据刷新配置启动/停止定时器，避免在组件层重复管理。
  useEffect(() => {
    if (!refreshConfig.enabled) return

    const stockTimer = setInterval(() => {
      void refreshStockQuotesRef.current()
    }, refreshConfig.stockInterval)

    const fundTimer = setInterval(() => {
      void refreshFundQuotesRef.current()
    }, refreshConfig.fundInterval)

    return () => {
      clearInterval(stockTimer)
      clearInterval(fundTimer)
    }
  }, [
    refreshConfig.enabled,
    refreshConfig.stockInterval,
    refreshConfig.fundInterval,
  ])

  // 响应式规则：窄屏自动收起，宽屏自动展开。
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 1024) {
        setSidebarCollapsed(true)
      } else if (width >= 1280) {
        setSidebarCollapsed(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarCollapsed])
}
