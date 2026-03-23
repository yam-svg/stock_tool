import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { FundGroup, Fund, FundQuote } from '../../shared/types'
import FundService from '../services/fundService'
import { ALL_FUND_GROUP_ID, isSystemFundGroup } from '../../shared/groupConstants'


interface FundState {
  // 数据
  fundGroups: FundGroup[]
  funds: Fund[]
  fundQuotes: Record<string, FundQuote>
  selectedFundGroup: string | null

  // 状态
  loading: boolean
  error: string | null
  refreshing: boolean

  // 分组操作
  createFundGroup: (name: string) => Promise<void>
  selectFundGroup: (groupId: string | null) => void
  updateFundGroup: (id: string, name: string) => Promise<void>
  deleteFundGroup: (id: string) => Promise<void>

  // 基金操作
  addFund: (fund: Omit<Fund, 'id' | 'createdAt'>) => Promise<void>
  updateFund: (id: string, updates: Partial<Omit<Fund, 'id' | 'createdAt'>>) => Promise<void>
  deleteFund: (id: string) => Promise<void>
  moveFundToGroup: (fundId: string, newGroupId: string) => Promise<void>
  reorderFunds: (fundIds: string[]) => Promise<void>

  // 数据刷新
  refreshFundQuotes: () => Promise<void>

  // 初始化
  initialize: () => Promise<void>

  // 工具方法
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useFundStore = create<FundState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      fundGroups: [],
      funds: [],
      fundQuotes: {},
      selectedFundGroup: null,
      loading: false,
      error: null,
      refreshing: false,

      // 初始化
      initialize: async () => {
        set({ loading: true, error: null })
        try {
          const [fundGroups, funds] = await Promise.all([
            window.electronAPI.db.getFundGroups(),
            window.electronAPI.db.getFunds()
          ])

          // 确保基金按 sortOrder 排序
          const sortedFunds = funds.sort((a: Fund, b: Fund) =>
            ((a.sortOrder || 0) - (b.sortOrder || 0))
          )

          set({ fundGroups, funds: sortedFunds })

          // 如果没有分组，则创建默认分组
          if (fundGroups.length === 0) {
            await get().createFundGroup('我的基金')
          }

          // 初始默认选择第一个分组
          const initialSelectedFundGroup = localStorage.getItem('selectedFundGroup')
          set({
            selectedFundGroup: fundGroups.some(g => g.id === initialSelectedFundGroup)
              ? initialSelectedFundGroup
              : fundGroups[0]?.id || null
          })

          // 加载行情数据
          await get().refreshFundQuotes()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '基金数据初始化失败' })
        } finally {
          set({ loading: false })
        }
      },

      // 分组操作
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

      selectFundGroup: (groupId) => {
        set({ selectedFundGroup: groupId })
        if (groupId) {
          localStorage.setItem('selectedFundGroup', groupId)
        } else {
          localStorage.removeItem('selectedFundGroup')
        }
      },

      updateFundGroup: async (id, name) => {
        if (isSystemFundGroup(id)) return
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

      deleteFundGroup: async (id) => {
        if (isSystemFundGroup(id)) return
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.deleteFundGroup(id)
          set(state => ({
            fundGroups: state.fundGroups.filter(group => group.id !== id),
            selectedFundGroup:
              state.selectedFundGroup === id
                ? state.fundGroups.find(group => group.id === ALL_FUND_GROUP_ID)?.id || null
                : state.selectedFundGroup,
            funds: state.funds.filter(fund => fund.groupId !== id)
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除分组失败' })
        } finally {
          set({ loading: false })
        }
      },

      // 基金操作
      addFund: async (fundData) => {
        set({ loading: true, error: null })
        try {
          const fund = await window.electronAPI.db.createFund(fundData)
          set(state => ({
            funds: [...state.funds, fund].sort((a: Fund, b: Fund) =>
              ((a.sortOrder || 0) - (b.sortOrder || 0))
            )
          }))
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

      reorderFunds: async (fundIds: string[]) => {
        try {
          // 更新本地状态
          const updates = fundIds.map((id: string, index: number) => ({ id, sortOrder: index }))
          
          set(state => ({
            funds: state.funds.map(fund => {
              const update = updates.find((u: { id: string; sortOrder: number }) => u.id === fund.id)
              return update ? { ...fund, sortOrder: update.sortOrder } : fund
            }).sort((a: Fund, b: Fund) => ((a.sortOrder || 0) - (b.sortOrder || 0)))
          }))
          
          // 保存到数据库
          await window.electronAPI.db.updateFundsSortOrder(updates)
        } catch (error) {
          console.error('重新排序基金失败:', error)
          set({ error: error instanceof Error ? error.message : '重新排序失败' })
        }
      },

      // 数据刷新
      refreshFundQuotes: async () => {
        const startTime = Date.now()
        set({ refreshing: true })
        try {
          const codes = [...new Set(get().funds.map(f => f.code))]
          if (codes.length === 0) return

          const quotes = await FundService.getFundQuotes(codes)
          console.log(quotes)
          const quoteMap: Record<string, FundQuote> = {}
          quotes.forEach((quote: FundQuote) => {
            quoteMap[quote.code] = quote
          })

          set({ fundQuotes: quoteMap })
        } catch (error) {
          console.error('刷新基金行情失败:', error)
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
      name: 'fund-store'
    }
  )
)

