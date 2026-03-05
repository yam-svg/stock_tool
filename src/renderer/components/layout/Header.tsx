import { Activity, Globe, Moon, PieChart, RefreshCw, Sun, TrendingUp } from 'lucide-react'
import React from 'react'
import { FaChartLine } from 'react-icons/fa'
import { Tabs, IconButton } from '../../ui'

interface HeaderProps {
  darkMode: boolean
  activeTab: 'stock' | 'fund' | 'global'
  stockProfit?: number
  fundProfit?: number
  refreshConfig: { enabled: boolean }
  stockRefreshing?: boolean
  fundRefreshing?: boolean
  globalRefreshing?: boolean
  isMarketOpen?: boolean
  nextMarketOpenTime?: string
  setActiveTab: (tab: 'stock' | 'fund' | 'global') => void
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
  stockRefreshing = false,
  fundRefreshing = false,
  globalRefreshing = false,
  isMarketOpen = true,
  nextMarketOpenTime = '',
  setActiveTab,
  toggleDarkMode,
  toggleRefresh,
  onManualRefresh
}) => {
  const isRefreshing = stockRefreshing || fundRefreshing || globalRefreshing
  
  return (
    <header className={`${
      
      darkMode
        ? 'bg-gray-800/80 backdrop-blur-md border-gray-700/50'
        : 'bg-white/80 backdrop-blur-md border-gray-200/50'
    } border-b sticky top-0 z-50 px-4 py-2 shadow-sm`}>
      <div className="flex items-center justify-between w-full px-4">
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${
              darkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
            }`}>
              <FaChartLine className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h1
              className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              StockLite
            </h1>
          </div>
          
          {/* Tab 切换 */}
          <Tabs
            activeTab={activeTab as string}
            onChange={(tab) => setActiveTab(tab as 'stock' | 'fund' | 'global')}
            tabs={[
              { id: 'stock', label: '股票', icon: <TrendingUp /> },
              { id: 'fund', label: '基金', icon: <PieChart /> },
              { id: 'global', label: '全球市场', icon: <Globe /> },
            ]}
            size="md"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* 全球市场模式下隐藏股票/基金收益，仅保留与市场数据相关控制 */}
          {activeTab !== 'global' && stockProfit !== undefined && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${
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
          {activeTab !== 'global' && fundProfit !== undefined && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${
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
          <IconButton
            onClick={onManualRefresh}
            disabled={isRefreshing}
            darkMode={darkMode}
            icon={<RefreshCw className={isRefreshing ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />}
            tooltip={isRefreshing ? '正在刷新...' : '手动刷新'}
          />
          
          {/* 深色模式切换 */}
          <IconButton
            onClick={toggleDarkMode}
            darkMode={darkMode}
            icon={darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            tooltip={darkMode ? '切换到浅色模式' : '切换到深色模式'}
            className={darkMode ? 'text-yellow-400' : ''}
          />
          
          {/* 刷新开关 */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
            darkMode ? 'bg-black/10' : 'bg-black/5'
          } ${!isMarketOpen ? 'opacity-60' : ''} transition-all duration-300`}>
            <Activity className={`w-3.5 h-3.5 transition-colors duration-300 ${
              isRefreshing ? 'text-green-500' : !isMarketOpen ? 'text-orange-500' : 'text-gray-500'
            }`} />
            <span className="text-xs font-medium">
              {!isMarketOpen ? nextMarketOpenTime : '自动刷新'}
            </span>
            <button
              onClick={() => toggleRefresh(!refreshConfig.enabled)}
              disabled={!isMarketOpen}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ${
                refreshConfig.enabled ? 'bg-green-500' : 'bg-gray-300'
              } ${!isMarketOpen ? 'cursor-not-allowed opacity-50' : ''}`}
              title={
                !isMarketOpen
                  ? `市场未开市，${nextMarketOpenTime}`
                  : refreshConfig.enabled
                    ? '点击关闭自动刷新'
                    : '点击开启自动刷新'
              }
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                  refreshConfig.enabled ? 'translate-x-3' : 'translate-x-0.5'
                } shadow-sm`}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
