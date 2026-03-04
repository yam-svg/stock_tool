import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  StockGroup, 
  FundGroup, 
  Stock, 
  Fund, 
  StockQuote, 
  FundQuote,
  RefreshConfig
} from '../../shared/types'
import StockService from '../services/stockService'
import FundService from '../services/fundService'

interface StoreState {
  // UI状态
  activeTab: 'stock' | 'fund'
  darkMode: boolean
  
  //刷新配置
  refreshConfig: RefreshConfig
  
  // 分组状态
  stockGroups: StockGroup[]
  fundGroups: FundGroup[]
  selectedStockGroup: string | null
  selectedFundGroup: string | null
  
  //持状态
  stocks: Stock[]
  funds: Fund[]
  
  //行数据
  stockQuotes: Record<string, StockQuote>
  fundQuotes: Record<string, FundQuote>
  
  // 加载状态
  loading: boolean
  error: string | null
  
  // 初始化
  initialize: () => Promise<void>
  
  // 分组操作
  createStockGroup: (name: string) => Promise<void>
  createFundGroup: (name: string) => Promise<void>
  selectStockGroup: (groupId: string | null) => void
  selectFundGroup: (groupId: string | null) => void
  updateStockGroup: (id: string, name: string) => Promise<void>
  updateFundGroup: (id: string, name: string) => Promise<void>
  deleteStockGroup: (id: string) => Promise<void>
  deleteFundGroup: (id: string) => Promise<void>
  
  //操作
  addStock: (stock: Omit<Stock, 'id' | 'createdAt'>) => Promise<void>
  updateStock: (id: string, updates: Partial<Omit<Stock, 'id' | 'createdAt'>>) => Promise<void>
  deleteStock: (id: string) => Promise<void>
  moveStockToGroup: (stockId: string, newGroupId: string) => Promise<void>
  
  //基金操作
  addFund: (fund: Omit<Fund, 'id' | 'createdAt'>) => Promise<void>
  updateFund: (id: string, updates: Partial<Omit<Fund, 'id' | 'createdAt'>>) => Promise<void>
  deleteFund: (id: string) => Promise<void>
  moveFundToGroup: (fundId: string, newGroupId: string) => Promise<void>
  
  // 数据刷新
  refreshStockQuotes: () => Promise<void>
  refreshFundQuotes: () => Promise<void>
  setRefreshConfig: (config: Partial<RefreshConfig>) => void
  toggleRefresh: (enabled: boolean) => void
  
  // UI操作
  setActiveTab: (tab: 'stock' | 'fund') => void
  toggleDarkMode: () => void
  clearError: () => void
}

export const useStore = create<StoreState>()(
  devtools(
    (set, get) => ({
      //初始状态
      activeTab: 'stock',
      refreshConfig: {
        stockInterval: 3000,
        fundInterval: 60000,
        enabled: true
      },
      darkMode: false,
      stockGroups: [],
      fundGroups: [],
      selectedStockGroup: null,
      selectedFundGroup: null,
      stocks: [],
      funds: [],
      stockQuotes: {},
      fundQuotes: {},
      loading: false,
      error: null,

      // 初始化
      initialize: async () => {
        set({ loading: true, error: null })
        try {
          // 加载配置
          const savedDarkMode = localStorage.getItem('darkMode') === 'true'
          const savedRefreshConfig = localStorage.getItem('refreshConfig')
          if (savedRefreshConfig) {
            try {
              const config = JSON.parse(savedRefreshConfig)
              set({ refreshConfig: config })
            } catch (e) {
              console.error('Failed to parse saved refresh config', e)
            }
          }
          set({ darkMode: savedDarkMode })

          // 加载分组和持仓数据
          const [stockGroups, fundGroups, stocks, funds] = await Promise.all([
            window.electronAPI.db.getStockGroups(),
            window.electronAPI.db.getFundGroups(),
            window.electronAPI.db.getStocks(),
            window.electronAPI.db.getFunds()
          ])
          
          set({ stockGroups, fundGroups, stocks, funds })

          // 如果没有分组，则创建默认分组
          if (stockGroups.length === 0) {
            await get().createStockGroup('我的股票')
          }
          if (fundGroups.length === 0) {
            await get().createFundGroup('我的基金')
          }

          // 初始默认选择第一个分组
          const initialSelectedStockGroup = localStorage.getItem('selectedStockGroup')
          const initialSelectedFundGroup = localStorage.getItem('selectedFundGroup')

          set({
            selectedStockGroup: stockGroups.some(g => g.id === initialSelectedStockGroup)
              ? initialSelectedStockGroup
              : stockGroups[0]?.id || null,
            selectedFundGroup: fundGroups.some(g => g.id === initialSelectedFundGroup)
              ? initialSelectedFundGroup
              : fundGroups[0]?.id || null
          })
          
          // 加载行情数据
          await get().refreshStockQuotes()
          await get().refreshFundQuotes()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '初始化失败' })
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

      createFundGroup: async (name) => {
        set({ loading: true, error: null })
        try {
          const group = await window.electronAPI.db.createFundGroup(name)
          set(state => ({ 
            fundGroups: [...state.fundGroups, group],
            selectedFundGroup: group.id
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
      selectFundGroup: (groupId) => {
        set({ selectedFundGroup: groupId })
        if (groupId) {
          localStorage.setItem('selectedFundGroup', groupId)
        } else {
          localStorage.removeItem('selectedFundGroup')
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

      updateFundGroup: async (id, name) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.updateFundGroup(id, name)
          set(state => ({
            fundGroups: state.fundGroups.map(group => 
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

      deleteFundGroup: async (id) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.deleteFundGroup(id)
          set(state => ({
            fundGroups: state.fundGroups.filter(group => group.id !== id),
            selectedFundGroup: state.selectedFundGroup === id ? null : state.selectedFundGroup,
            funds: state.funds.filter(fund => fund.groupId !== id)
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除分组失败' })
        } finally {
          set({ loading: false })
        }
      },

      //操作
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

      //基金操作
      addFund: async (fundData) => {
        set({ loading: true, error: null })
        try {
          const fund = await window.electronAPI.db.createFund(fundData)
          set(state => ({ funds: [...state.funds, fund] }))
          await get().refreshFundQuotes()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '添加基金失败' })
        } finally {
          set({ loading: false })
        }
      },

      updateFund: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.updateFund(id, updates)
          set(state => ({
            funds: state.funds.map(fund => 
              fund.id === id ? { ...fund, ...updates } : fund
            )
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '更新基金失败' })
        } finally {
          set({ loading: false })
        }
      },

      deleteFund: async (id) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.deleteFund(id)
          set(state => ({
            funds: state.funds.filter(fund => fund.id !== id)
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除基金失败' })
        } finally {
          set({ loading: false })
        }
      },

      moveFundToGroup: async (fundId, newGroupId) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.updateFund(fundId, { groupId: newGroupId })
          set(state => ({
            funds: state.funds.map(fund =>
              fund.id === fundId ? { ...fund, groupId: newGroupId } : fund
            )
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '移动基金失败' })
        } finally {
          set({ loading: false })
        }
      },

      // 数据刷新
      refreshStockQuotes: async () => {
        try {
          const symbols = [...new Set(get().stocks.map(s => s.symbol))]
          if (symbols.length === 0) return
          const quotes = await StockService.getStockQuotes(symbols)
          const quoteMap: Record<string, StockQuote> = {}
          quotes.forEach((quote: StockQuote) => {
            quoteMap[quote.symbol] = quote
            // 也通过去除前缀后的代码作为 key，以兼容旧数据或无前缀请求
            const shortSymbol = quote.symbol.replace(/^(sh|sz|hk|us)/i, '')
            quoteMap[shortSymbol] = quote
          })
          console.log(quotes)
          set({ stockQuotes: quoteMap })
        } catch (error) {
          console.error('刷新股票行情失败:', error)
        }
      },

      refreshFundQuotes: async () => {
        try {
          const codes = [...new Set(get().funds.map(f => f.code))]
          if (codes.length === 0) return
          
          const quotes = await FundService.getFundQuotes(codes)
          const quoteMap: Record<string, FundQuote> = {}
          quotes.forEach((quote: FundQuote) => {
            quoteMap[quote.code] = quote
          })
          
          set({ fundQuotes: quoteMap })
        } catch (error) {
          console.error('刷新基金行情失败:', error)
        }
      },

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

      // UI操作
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleDarkMode: () => {
        const newMode = !get().darkMode
        set({ darkMode: newMode })
        localStorage.setItem('darkMode', newMode.toString())
      },
      clearError: () => set({ error: null })
    }),
    {
      name: 'stocklite-store'
    }
  )
)