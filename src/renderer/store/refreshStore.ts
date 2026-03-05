import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { RefreshConfig } from '../../shared/types'
import { isMarketOpen, getNextMarketOpenTime } from '../../shared/marketTime'

interface RefreshState {
  refreshConfig: RefreshConfig
  loading: boolean
  error: string | null
  isMarketOpen: boolean
  nextMarketOpenTime: string
  marketCheckTimer: NodeJS.Timeout | null

  setRefreshConfig: (config: Partial<RefreshConfig>) => void
  toggleRefresh: (enabled: boolean) => void
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
        enabled: true
      },
      loading: false,
      error: null,
      isMarketOpen: isMarketOpen(),
      nextMarketOpenTime: getNextMarketOpenTime(),
      marketCheckTimer: null,

      setRefreshConfig: (config) => {
        const newConfig = { ...get().refreshConfig, ...config }
        set({ refreshConfig: newConfig })
        localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
      },

      toggleRefresh: (enabled) => {
        const state = get()
        // 未开市时不允许手动打开
        if (!state.isMarketOpen && enabled) {
          console.log('市场未开市，无法开启自动刷新')
          return
        }
        
        const newConfig = { ...state.refreshConfig, enabled }
        set({ refreshConfig: newConfig })
        localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
      },

      checkMarketStatus: () => {
        const marketOpen = isMarketOpen()
        const state = get()
        
        set({
          isMarketOpen: marketOpen,
          nextMarketOpenTime: getNextMarketOpenTime()
        })

        // 市场状态变化时自动调整刷新开关
        if (marketOpen !== state.isMarketOpen) {
          if (marketOpen) {
            // 开市 -> 自动打开刷新
            console.log('市场开市，自动启用刷新功能')
            const newConfig = { ...state.refreshConfig, enabled: true }
            set({ refreshConfig: newConfig })
            localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
          } else {
            // 休市 -> 自动关闭刷新
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
          const marketOpen = isMarketOpen()
          set({
            isMarketOpen: marketOpen,
            nextMarketOpenTime: getNextMarketOpenTime()
          })

          // 根据市场状态设置刷新开关
          if (!marketOpen) {
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
      }
    }),
    {
      name: 'refresh-store'
    }
  )
)

