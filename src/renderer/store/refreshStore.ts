import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { RefreshConfig } from '../../shared/types'
import { getNextMarketOpenTime, isMarketOpen, MarketType } from '../../shared/marketTime'

interface RefreshState {
  refreshConfig: RefreshConfig
  loading: boolean
  error: string | null
  isMarketOpen: boolean
  nextMarketOpenTime: string
  stockMarketOpen: boolean
  futureMarketOpen: boolean
  stockNextMarketOpenTime: string
  futureNextMarketOpenTime: string
  marketCheckTimer: NodeJS.Timeout | null

  setRefreshConfig: (config: Partial<RefreshConfig>) => void
  toggleRefresh: (enabled: boolean, marketType?: MarketType) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  checkMarketStatus: () => void
  startMarketCheckTimer: () => void
  stopMarketCheckTimer: () => void

  // 初始化
  initialize: () => Promise<void>
}

export const useRefreshStore = create<RefreshState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      refreshConfig: {
        stockInterval: 1500,
        fundInterval: 60000,
        enabled: true,
      },
      loading: false,
      error: null,
      isMarketOpen: isMarketOpen('stock') || isMarketOpen('future'),
      nextMarketOpenTime: getNextMarketOpenTime('stock'),
      stockMarketOpen: isMarketOpen('stock'),
      futureMarketOpen: isMarketOpen('future'),
      stockNextMarketOpenTime: getNextMarketOpenTime('stock'),
      futureNextMarketOpenTime: getNextMarketOpenTime('future'),
      marketCheckTimer: null,

      setRefreshConfig: (config) => {
        const newConfig = { ...get().refreshConfig, ...config }
        set({ refreshConfig: newConfig })
        localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
      },

      toggleRefresh: (enabled, marketType = 'stock') => {
        const state = get()
        const canEnable = marketType === 'future' ? state.futureMarketOpen : state.stockMarketOpen

        // 未开市时不允许手动打开
        if (!canEnable && enabled) {
          console.log('当前市场未开市，无法开启自动刷新')
          return
        }

        const newConfig = { ...state.refreshConfig, enabled }
        set({ refreshConfig: newConfig })
        localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
      },

      checkMarketStatus: () => {
        const stockOpen = isMarketOpen('stock')
        const futureOpen = isMarketOpen('future')
        const stockNextOpen = getNextMarketOpenTime('stock')
        const futureNextOpen = getNextMarketOpenTime('future')
        const state = get()

        const previousAnyOpen = state.stockMarketOpen || state.futureMarketOpen
        const currentAnyOpen = stockOpen || futureOpen

        set({
          stockMarketOpen: stockOpen,
          futureMarketOpen: futureOpen,
          stockNextMarketOpenTime: stockNextOpen,
          futureNextMarketOpenTime: futureNextOpen,
          // 保持向后兼容字段：用“任一市场开市”表示是否可刷新
          isMarketOpen: currentAnyOpen,
          nextMarketOpenTime: stockNextOpen,
        })

        // 仅在“任一市场”整体状态变化时调整刷新开关
        if (currentAnyOpen !== previousAnyOpen) {
          if (currentAnyOpen) {
            console.log('市场开市，自动启用刷新功能')
            const newConfig = { ...state.refreshConfig, enabled: true }
            set({ refreshConfig: newConfig })
            localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
          } else {
            console.log('市场休市，自动禁用刷新功能')
            const newConfig = { ...state.refreshConfig, enabled: false }
            set({ refreshConfig: newConfig })
            localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
          }
        }
      },

      startMarketCheckTimer: () => {
        const state = get()

        // 清除旧定时器
        if (state.marketCheckTimer) {
          clearInterval(state.marketCheckTimer)
        }

        // 立即检查一次
        get().checkMarketStatus()

        // 每分钟检查一次市场状态
        const timer = setInterval(() => {
          get().checkMarketStatus()
        }, 60000) // 60秒

        set({ marketCheckTimer: timer })
      },

      stopMarketCheckTimer: () => {
        const state = get()
        if (state.marketCheckTimer) {
          clearInterval(state.marketCheckTimer)
          set({ marketCheckTimer: null })
        }
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      initialize: async () => {
        set({ loading: true, error: null })
        try {
          const savedRefreshConfig = localStorage.getItem('refreshConfig')
          if (savedRefreshConfig) {
            try {
              const config = JSON.parse(savedRefreshConfig)
              set({ refreshConfig: config })
            } catch (e) {
              console.error('Failed to parse saved refresh config', e)
            }
          }

          // 检查市场状态并设置初始刷新状态
          const stockOpen = isMarketOpen('stock')
          const futureOpen = isMarketOpen('future')
          const anyOpen = stockOpen || futureOpen
          set({
            stockMarketOpen: stockOpen,
            futureMarketOpen: futureOpen,
            stockNextMarketOpenTime: getNextMarketOpenTime('stock'),
            futureNextMarketOpenTime: getNextMarketOpenTime('future'),
            isMarketOpen: anyOpen,
            nextMarketOpenTime: getNextMarketOpenTime('stock'),
          })

          // 根据市场状态设置刷新开关
          if (!anyOpen) {
            const newConfig = { ...get().refreshConfig, enabled: false }
            set({ refreshConfig: newConfig })
            localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
          }

          // 启动市场状态检查定时器
          get().startMarketCheckTimer()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '刷新配置初始化失败' })
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: 'refresh-store',
    },
  ),
)

