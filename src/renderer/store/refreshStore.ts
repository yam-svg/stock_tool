import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { RefreshConfig } from '../../shared/types'

interface RefreshState {
  refreshConfig: RefreshConfig
  loading: boolean
  error: string | null

  setRefreshConfig: (config: Partial<RefreshConfig>) => void
  toggleRefresh: (enabled: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
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

      setRefreshConfig: (config) => {
        const newConfig = { ...get().refreshConfig, ...config }
        set({ refreshConfig: newConfig })
        localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
      },

      toggleRefresh: (enabled) => {
        const newConfig = { ...get().refreshConfig, enabled }
        set({ refreshConfig: newConfig })
        localStorage.setItem('refreshConfig', JSON.stringify(newConfig))
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

