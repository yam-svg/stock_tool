import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { GlobalIndexQuote, GlobalIndexTrendPoint } from '../../shared/types'
import GlobalMarketService from '../services/globalMarketService'

const TREND_CACHE_TTL = 60 * 1000

interface GlobalMarketState {
  globalIndexes: GlobalIndexQuote[]
  trendTodayBySymbol: Record<string, GlobalIndexTrendPoint[]>
  trendFetchedAtBySymbol: Record<string, number>
  refreshing: boolean
  loading: boolean
  error: string | null

  refreshGlobalIndexes: () => Promise<void>
  refreshGlobalIndexTrends: (symbols?: string[], force?: boolean) => Promise<void>
  initialize: () => Promise<void>
  clearError: () => void
}

export const useGlobalMarketStore = create<GlobalMarketState>()(
  devtools(
    (set, get) => ({
      globalIndexes: [],
      trendTodayBySymbol: {},
      trendFetchedAtBySymbol: {},
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
          void get().refreshGlobalIndexTrends(quotes.map((item) => item.symbol))
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

      refreshGlobalIndexTrends: async (symbols, force = false) => {
        const state = get()
        const targetSymbols = Array.from(new Set((symbols && symbols.length > 0)
          ? symbols
          : state.globalIndexes.map((item) => item.symbol)))

        if (targetSymbols.length === 0) return

        const now = Date.now()
        const toFetch = targetSymbols.filter((symbol) => {
          if (force) return true
          const fetchedAt = state.trendFetchedAtBySymbol[symbol] || 0
          const cachedPoints = state.trendTodayBySymbol[symbol]
          return !cachedPoints || cachedPoints.length === 0 || (now - fetchedAt) > TREND_CACHE_TTL
        })

        if (toFetch.length === 0) return

        const trendUpdates: Record<string, GlobalIndexTrendPoint[]> = {}
        const fetchedAtUpdates: Record<string, number> = {}

        await Promise.all(
          toFetch.map(async (symbol) => {
            try {
              const trend = await GlobalMarketService.getGlobalIndexTrendToday(symbol)
              if (!trend || !Array.isArray(trend.points) || trend.points.length === 0) return
              trendUpdates[symbol] = trend.points
              fetchedAtUpdates[symbol] = now
            } catch (error) {
              console.warn(`获取指数日内走势失败: ${symbol}`, error)
            }
          }),
        )

        if (Object.keys(trendUpdates).length === 0) return

        set((prev) => ({
          trendTodayBySymbol: { ...prev.trendTodayBySymbol, ...trendUpdates },
          trendFetchedAtBySymbol: { ...prev.trendFetchedAtBySymbol, ...fetchedAtUpdates },
        }))
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

