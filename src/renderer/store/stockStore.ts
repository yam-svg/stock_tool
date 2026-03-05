import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { StockGroup, Stock, StockQuote } from '../../shared/types'
import StockService from '../services/stockService'


interface StockState {
  // 数据
  stockGroups: StockGroup[]
  stocks: Stock[]
  stockQuotes: Record<string, StockQuote>
  selectedStockGroup: string | null

  // 状态
  loading: boolean
  error: string | null
  refreshing: boolean

  // 分组操作
  createStockGroup: (name: string) => Promise<void>
  selectStockGroup: (groupId: string | null) => void
  updateStockGroup: (id: string, name: string) => Promise<void>
  deleteStockGroup: (id: string) => Promise<void>

  // 股票操作
  addStock: (stock: Omit<Stock, 'id' | 'createdAt'>) => Promise<void>
  updateStock: (id: string, updates: Partial<Omit<Stock, 'id' | 'createdAt'>>) => Promise<void>
  deleteStock: (id: string) => Promise<void>
  moveStockToGroup: (stockId: string, newGroupId: string) => Promise<void>

  // 数据刷新
  refreshStockQuotes: () => Promise<void>

  // 初始化
  initialize: () => Promise<void>

  // 工具方法
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useStockStore = create<StockState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      stockGroups: [],
      stocks: [],
      stockQuotes: {},
      selectedStockGroup: null,
      loading: false,
      error: null,
      refreshing: false,

      // 初始化
      initialize: async () => {
        set({ loading: true, error: null })
        try {
          const [stockGroups, stocks] = await Promise.all([
            window.electronAPI.db.getStockGroups(),
            window.electronAPI.db.getStocks()
          ])

          set({ stockGroups, stocks })

          // 如果没有分组，则创建默认分组
          if (stockGroups.length === 0) {
            await get().createStockGroup('我的股票')
          }

          // 初始默认选择第一个分组
          const initialSelectedStockGroup = localStorage.getItem('selectedStockGroup')
          set({
            selectedStockGroup: stockGroups.some(g => g.id === initialSelectedStockGroup)
              ? initialSelectedStockGroup
              : stockGroups[0]?.id || null
          })

          // 加载行情数据
          await get().refreshStockQuotes()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '股票数据初始化失败' })
        } finally {
          set({ loading: false })
        }
      },

      // 分组操作
      createStockGroup: async (name) => {
        set({ loading: true, error: null })
        try {
          const group = await window.electronAPI.db.createStockGroup(name)
          set(state => ({
            stockGroups: [...state.stockGroups, group],
            selectedStockGroup: group.id
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '创建分组失败' })
        } finally {
          set({ loading: false })
        }
      },

      selectStockGroup: (groupId) => {
        set({ selectedStockGroup: groupId })
        if (groupId) {
          localStorage.setItem('selectedStockGroup', groupId)
        } else {
          localStorage.removeItem('selectedStockGroup')
        }
      },

      updateStockGroup: async (id, name) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.updateStockGroup(id, name)
          set(state => ({
            stockGroups: state.stockGroups.map(group =>
              group.id === id ? { ...group, name } : group
            )
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '更新分组失败' })
        } finally {
          set({ loading: false })
        }
      },

      deleteStockGroup: async (id) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.deleteStockGroup(id)
          set(state => ({
            stockGroups: state.stockGroups.filter(group => group.id !== id),
            selectedStockGroup: state.selectedStockGroup === id ? null : state.selectedStockGroup,
            stocks: state.stocks.filter(stock => stock.groupId !== id)
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除分组失败' })
        } finally {
          set({ loading: false })
        }
      },

      // 股票操作
      addStock: async (stockData) => {
        set({ loading: true, error: null })
        try {
          const stock = await window.electronAPI.db.createStock(stockData)
          set(state => ({ stocks: [...state.stocks, stock] }))
          await get().refreshStockQuotes()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '添加股票失败' })
        } finally {
          set({ loading: false })
        }
      },

      updateStock: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.updateStock(id, updates)
          set(state => ({
            stocks: state.stocks.map(stock =>
              stock.id === id ? { ...stock, ...updates } : stock
            )
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '更新股票失败' })
        } finally {
          set({ loading: false })
        }
      },

      deleteStock: async (id) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.deleteStock(id)
          set(state => ({
            stocks: state.stocks.filter(stock => stock.id !== id)
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除股票失败' })
        } finally {
          set({ loading: false })
        }
      },

      moveStockToGroup: async (stockId, newGroupId) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.updateStock(stockId, { groupId: newGroupId })
          set(state => ({
            stocks: state.stocks.map(stock =>
              stock.id === stockId ? { ...stock, groupId: newGroupId } : stock
            )
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '移动股票失败' })
        } finally {
          set({ loading: false })
        }
      },

      // 数据刷新
      refreshStockQuotes: async () => {
        const startTime = Date.now()
        set({ refreshing: true })
        try {
          const symbols = [...new Set(get().stocks.map(s => s.symbol))]
          if (symbols.length === 0) return
          const quotes = await StockService.getStockQuotes(symbols)
          const quoteMap: Record<string, StockQuote> = {}
          quotes.forEach((quote: StockQuote) => {
            quoteMap[quote.symbol] = quote
            const shortSymbol = quote.symbol.replace(/^(sh|sz|hk|us)/i, '')
            quoteMap[shortSymbol] = quote
          })
          set({ stockQuotes: quoteMap })
        } catch (error) {
          console.error('刷新股票行情失败:', error)
        } finally {
          // 确保刷新状态至少显示 600ms，让用户能看到反馈
          const elapsed = Date.now() - startTime
          const minDisplayTime = 600
          if (elapsed < minDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed))
          }
          set({ refreshing: false })
        }
      },

      // 工具方法
      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null })
    }),
    {
      name: 'stock-store'
    }
  )
)

