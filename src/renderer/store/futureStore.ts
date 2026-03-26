import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Future, FutureGroup, FutureQuote } from '../../shared/types'
import FutureService from '../services/futureService'
import { ALL_FUTURE_GROUP_ID, isSystemFutureGroup } from '../../shared/groupConstants'

interface FutureState {
  futureGroups: FutureGroup[]
  futures: Future[]
  futureQuotes: Record<string, FutureQuote>
  selectedFutureGroup: string | null

  loading: boolean
  error: string | null
  refreshing: boolean

  createFutureGroup: (name: string) => Promise<void>
  selectFutureGroup: (groupId: string | null) => void
  updateFutureGroup: (id: string, name: string) => Promise<void>
  deleteFutureGroup: (id: string) => Promise<void>

  addFuture: (future: Omit<Future, 'id' | 'createdAt'>) => Promise<void>
  updateFuture: (id: string, updates: Partial<Omit<Future, 'id' | 'createdAt'>>) => Promise<void>
  deleteFuture: (id: string) => Promise<void>
  moveFutureToGroup: (futureId: string, newGroupId: string) => Promise<void>
  reorderFutures: (futureIds: string[]) => Promise<void>

  refreshFutureQuotes: () => Promise<void>
  initialize: () => Promise<void>

  clearError: () => void
}

export const useFutureStore = create<FutureState>()(
  devtools(
    (set, get) => ({
      futureGroups: [],
      futures: [],
      futureQuotes: {},
      selectedFutureGroup: null,
      loading: false,
      error: null,
      refreshing: false,

      initialize: async () => {
        set({ loading: true, error: null })
        try {
          const [futureGroups, futures] = await Promise.all([
            window.electronAPI.db.getFutureGroups(),
            window.electronAPI.db.getFutures(),
          ])

          const sortedFutures = futures.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          const initialSelectedFutureGroup = localStorage.getItem('selectedFutureGroup')

          set({
            futureGroups,
            futures: sortedFutures,
            selectedFutureGroup: futureGroups.some((g) => g.id === initialSelectedFutureGroup)
              ? initialSelectedFutureGroup
              : futureGroups[0]?.id || null,
          })

          await get().refreshFutureQuotes()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '期货数据初始化失败' })
        } finally {
          set({ loading: false })
        }
      },

      createFutureGroup: async (name) => {
        set({ loading: true, error: null })
        try {
          const group = await window.electronAPI.db.createFutureGroup(name)
          set((state) => ({
            futureGroups: [...state.futureGroups, group],
            selectedFutureGroup: group.id,
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '创建分组失败' })
        } finally {
          set({ loading: false })
        }
      },

      selectFutureGroup: (groupId) => {
        set({ selectedFutureGroup: groupId })
        if (groupId) {
          localStorage.setItem('selectedFutureGroup', groupId)
        } else {
          localStorage.removeItem('selectedFutureGroup')
        }
      },

      updateFutureGroup: async (id, name) => {
        if (isSystemFutureGroup(id)) return
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.updateFutureGroup(id, name)
          set((state) => ({
            futureGroups: state.futureGroups.map((group) => (group.id === id ? { ...group, name } : group)),
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '更新分组失败' })
        } finally {
          set({ loading: false })
        }
      },

      deleteFutureGroup: async (id) => {
        if (isSystemFutureGroup(id)) return
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.deleteFutureGroup(id)
          set((state) => ({
            futureGroups: state.futureGroups.filter((group) => group.id !== id),
            selectedFutureGroup:
              state.selectedFutureGroup === id
                ? state.futureGroups.find((group) => group.id === ALL_FUTURE_GROUP_ID)?.id || null
                : state.selectedFutureGroup,
            futures: state.futures.filter((future) => future.groupId !== id),
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除分组失败' })
        } finally {
          set({ loading: false })
        }
      },

      addFuture: async (futureData) => {
        set({ loading: true, error: null })
        try {
          const future = await window.electronAPI.db.createFuture(futureData)
          set((state) => ({
            futures: [...state.futures, future].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
          }))
          await get().refreshFutureQuotes()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '添加期货失败' })
        } finally {
          set({ loading: false })
        }
      },

      updateFuture: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.updateFuture(id, updates)
          set((state) => ({
            futures: state.futures.map((future) => (future.id === id ? { ...future, ...updates } : future)),
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '更新期货失败' })
        } finally {
          set({ loading: false })
        }
      },

      deleteFuture: async (id) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.deleteFuture(id)
          set((state) => ({ futures: state.futures.filter((future) => future.id !== id) }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除期货失败' })
        } finally {
          set({ loading: false })
        }
      },

      moveFutureToGroup: async (futureId, newGroupId) => {
        set({ loading: true, error: null })
        try {
          await window.electronAPI.db.updateFuture(futureId, { groupId: newGroupId })
          set((state) => ({
            futures: state.futures.map((future) =>
              future.id === futureId ? { ...future, groupId: newGroupId } : future,
            ),
          }))
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '移动期货失败' })
        } finally {
          set({ loading: false })
        }
      },

      reorderFutures: async (futureIds) => {
        try {
          const updates = futureIds.map((id, index) => ({ id, sortOrder: index }))
          set((state) => ({
            futures: state.futures
              .map((future) => {
                const update = updates.find((u) => u.id === future.id)
                return update ? { ...future, sortOrder: update.sortOrder } : future
              })
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
          }))
          await window.electronAPI.db.updateFuturesSortOrder(updates)
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '重新排序失败' })
        }
      },

      refreshFutureQuotes: async () => {
        const startTime = Date.now()
        set({ refreshing: true })
        try {
          const symbols = [...new Set(get().futures.map((f) => f.symbol))]
          if (symbols.length === 0) return

          const quotes = await FutureService.getFutureQuotes(symbols)
          const quoteMap: Record<string, FutureQuote> = {}
          quotes.forEach((quote) => {
            quoteMap[quote.symbol] = quote
          })
          console.log(quoteMap)
          set({ futureQuotes: quoteMap })
        } catch (error) {
          console.error('刷新期货行情失败:', error)
        } finally {
          const elapsed = Date.now() - startTime
          const minDisplayTime = 600
          if (elapsed < minDisplayTime) {
            await new Promise((resolve) => setTimeout(resolve, minDisplayTime - elapsed))
          }
          set({ refreshing: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'future-store',
    },
  ),
)

