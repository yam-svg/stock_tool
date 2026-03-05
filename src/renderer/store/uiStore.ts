import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  activeTab: 'stock' | 'fund' | 'global'
  darkMode: boolean
  stockViewMode: 'card' | 'list'
  fundViewMode: 'card' | 'list'
  globalViewMode: 'card' | 'list'
  sidebarCollapsed: boolean

  setActiveTab: (tab: 'stock' | 'fund' | 'global') => void
  toggleDarkMode: () => void
  setStockViewMode: (mode: 'card' | 'list') => void
  setFundViewMode: (mode: 'card' | 'list') => void
  setGlobalViewMode: (mode: 'card' | 'list') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      activeTab: 'stock',
      darkMode: false,
      stockViewMode: 'card',
      fundViewMode: 'card',
      globalViewMode: 'card',
      sidebarCollapsed: false,

      // UI操作
      setActiveTab: (tab) => set({ activeTab: tab }),

      toggleDarkMode: () => {
        const newMode = !get().darkMode
        set({ darkMode: newMode })
        localStorage.setItem('darkMode', newMode.toString())
      },

      setStockViewMode: (mode: 'card' | 'list') => {
        set({ stockViewMode: mode })
        localStorage.setItem('stockViewMode', mode)
      },

      setFundViewMode: (mode: 'card' | 'list') => {
        set({ fundViewMode: mode })
        localStorage.setItem('fundViewMode', mode)
      },

      setGlobalViewMode: (mode: 'card' | 'list') => {
        set({ globalViewMode: mode })
        localStorage.setItem('globalViewMode', mode)
      },

      toggleSidebar: () => {
        const newState = !get().sidebarCollapsed
        set({ sidebarCollapsed: newState })
        localStorage.setItem('sidebarCollapsed', newState.toString())
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed })
        localStorage.setItem('sidebarCollapsed', collapsed.toString())
      }
    }),
    {
      name: 'ui-store'
    }
  )
)
