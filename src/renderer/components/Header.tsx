import React from 'react'
import { RefreshCw, Moon, Sun, TrendingUp, PieChart, Activity } from 'lucide-react'
import { FaChartLine } from 'react-icons/fa'
import { Tabs } from '../ui'

interface HeaderProps {
  darkMode: boolean
  activeTab: 'stock' | 'fund'
  stockProfit?: number
  fundProfit?: number
  refreshConfig: { enabled: boolean }
  setActiveTab: (tab: 'stock' | 'fund') => void
  toggleDarkMode: () => void
  toggleRefresh: (enabled: boolean) => void
  onManualRefresh: () => void
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  activeTab,
  stockProfit,
  fundProfit,
  refreshConfig,
  setActiveTab,
  toggleDarkMode,
  toggleRefresh,
  onManualRefresh
}) => {
  return (
    <header className={`${
      darkMode
        ? 'bg-gray-800/80 backdrop-blur-md border-gray-700/50'
        : 'bg-white/80 backdrop-blur-md border-gray-200/50'
    } border-b sticky top-0 z-50 px-4 py-2 shadow-sm`}>
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${
              darkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
            }`}>
              <FaChartLine className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              StockLite
            </h1>
          </div>
          
          {/* Tab 切换 */}
          <Tabs
            activeTab={activeTab as string}
            onChange={(tab) => setActiveTab(tab as 'stock' | 'fund')}
            tabs={[
              { id: 'stock', label: '股票', icon: <TrendingUp /> },
              { id: 'fund', label: '基金', icon: <PieChart /> }
            ]}
            size="md"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* 股票收益概览 */}
          {stockProfit !== undefined && (
            <div className={`px-3 py-1 rounded-md text-sm ${
              darkMode ? 'bg-gray-800/50' : 'bg-white/50'
            } border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="font-medium text-xs text-gray-500">股票收益</div>
              <div className={`font-bold text-sm ${
                stockProfit >= 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                ¥{stockProfit.toFixed(2)}
              </div>
            </div>
          )}

          {/* 基金收益概览 */}
          {fundProfit !== undefined && (
            <div className={`px-3 py-1 rounded-md text-sm ${
              darkMode ? 'bg-gray-800/50' : 'bg-white/50'
            } border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="font-medium text-xs text-gray-500">基金收益</div>
              <div className={`font-bold text-sm ${
                fundProfit >= 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                ¥{fundProfit.toFixed(2)}
              </div>
            </div>
          )}

          {/* 手动刷新按钮 */}
          <button
            onClick={onManualRefresh}
            className={`p-2 rounded-lg transition-all duration-200 ${
              darkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900'
            } border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } hover:shadow-md`}
            title="手动刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* 刷新开关 */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5">
            <Activity className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium">自动刷新</span>
            <button
              onClick={() => toggleRefresh(!refreshConfig.enabled)}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${
                refreshConfig.enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                  refreshConfig.enabled ? 'translate-x-3' : 'translate-x-0.5'
                } shadow-sm`}
              />
            </button>
          </div>

          {/* 深色模式切换 */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-all duration-200 ${
              darkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
                : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900'
            } border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } hover:shadow-md`}
            title={darkMode ? '切换到浅色模式' : '切换到深色模式'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}

