import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { GlobalIndexQuote } from '../../shared/types'
import GlobalMarketService from '../services/globalMarketService'

interface GlobalMarketState {
  globalIndexes: GlobalIndexQuote[]
  refreshing: boolean
  loading: boolean
  error: string | null

  refreshGlobalIndexes: () => Promise<void>
  initialize: () => Promise<void>
  clearError: () => void
}

export const useGlobalMarketStore = create<GlobalMarketState>()(
  devtools(
    (set, get) => ({
      globalIndexes: [],
      refreshing: false,
      loading: false,
      error: null,

      refreshGlobalIndexes: async () => {
        const startTime = Date.now()
        set({ refreshing: true })
        try {
          const quotes = await GlobalMarketService.getGlobalIndexQuotes()
          console.log(quotes)
          set({ globalIndexes: quotes })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '全球市场数据刷新失败' })
        } finally {
          const elapsed = Date.now() - startTime
          const minDisplayTime = 600
          if (elapsed < minDisplayTime) {
            await new Promise((resolve) => setTimeout(resolve, minDisplayTime - elapsed))
          }
          set({ refreshing: false })
        }
      },

      initialize: async () => {
        set({ loading: true, error: null })
        try {
          await get().refreshGlobalIndexes()
        } finally {
          set({ loading: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'global-market-store',
    },
  ),
)

