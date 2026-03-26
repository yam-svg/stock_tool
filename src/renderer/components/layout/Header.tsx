import { Activity, CandlestickChart, Globe, Moon, PieChart, RefreshCw, Sun, TrendingUp } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { FaChartLine } from 'react-icons/fa'
import { Tabs, IconButton } from '../../ui'

interface HeaderProps {
  darkMode: boolean
  activeTab: 'stock' | 'fund' | 'future' | 'global'
  stockProfit?: number
  fundProfit?: number
  futureProfit?: number
  refreshConfig: { enabled: boolean }
  stockRefreshing?: boolean
  fundRefreshing?: boolean
  futureRefreshing?: boolean
  globalRefreshing?: boolean
  isMarketOpen?: boolean
  nextMarketOpenTime?: string
  setActiveTab: (tab: 'stock' | 'fund' | 'future' | 'global') => void
  toggleDarkMode: () => void
  toggleRefresh: (enabled: boolean) => void
  onManualRefresh: () => void
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  activeTab,
  stockProfit,
  fundProfit,
  futureProfit,
  refreshConfig,
  stockRefreshing = false,
  fundRefreshing = false,
  futureRefreshing = false,
  globalRefreshing = false,
  isMarketOpen = true,
  nextMarketOpenTime = '',
  setActiveTab,
  toggleDarkMode,
  toggleRefresh,
  onManualRefresh
}) => {
  // 根据当前活动标签页获取对应的刷新状态
  const getCurrentRefreshingState = () => {
    switch (activeTab) {
      case 'stock':
        return stockRefreshing
      case 'fund':
        return fundRefreshing
      case 'global':
        return globalRefreshing
      case 'future':
        return futureRefreshing
      default:
        return false
    }
  }

  const isRefreshing = getCurrentRefreshingState()
  const containerRef = useRef<HTMLDivElement>(null)
  const [showProfits, setShowProfits] = useState(true)
  const [showRightControls, setShowRightControls] = useState(true)

  useEffect(() => {
    const updateVisibility = () => {
      if (!containerRef.current) return

      const width = containerRef.current.offsetWidth
      // 当宽度小于 930 时，隐藏收益卡片
      // 当宽度小于 600 时，隐藏右侧所有控制元素（刷新、深色、开关等）
      setShowProfits(width >= 930)
      setShowRightControls(width >= 600)
    }

    updateVisibility()
    const resizeObserver = new ResizeObserver(updateVisibility)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <header
      className={`${
        darkMode
          ? 'bg-gray-800/80 backdrop-blur-md border-gray-700/50'
          : 'bg-white/80 backdrop-blur-md border-gray-200/50'
      } border-b sticky top-0 z-50 px-4 py-2 shadow-sm`}
    >
      <div ref={containerRef} className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-6 min-w-0">
          {/* Logo */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div
              className={`p-1.5 rounded-lg ${
                darkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
              }`}
            >
              <FaChartLine className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
              StockLite
            </h1>
          </div>

          {/* Tab 切换 */}
          <Tabs
            activeTab={activeTab as string}
            onChange={(tab) => setActiveTab(tab as 'stock' | 'fund' | 'future' | 'global')}
            tabs={[
              { id: 'stock', label: '股票', icon: <TrendingUp /> },
              { id: 'fund', label: '基金', icon: <PieChart /> },
              { id: 'future', label: '期货', icon: <CandlestickChart /> },
              { id: 'global', label: '全球市场', icon: <Globe /> },
            ]}
            size="md"
          />
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* 收益卡片 - 宽度不足时第一个隐藏 */}
          {showProfits && (
            <>
              {activeTab !== 'global' && stockProfit !== undefined && (
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${
                    darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                  } border ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  } whitespace-nowrap`}
                >
                  <div className="font-medium text-xs text-gray-500">股票收益</div>
                  <div
                    className={`font-bold text-sm ${
                      stockProfit >= 0 ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    ¥{stockProfit.toFixed(2)}
                  </div>
                </div>
              )}

              {/* 基金收益概览 */}
              {activeTab !== 'global' && fundProfit !== undefined && (
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${
                    darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                  } border ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  } whitespace-nowrap`}
                >
                  <div className="font-medium text-xs text-gray-500">基金收益</div>
                  <div
                    className={`font-bold text-sm ${
                      fundProfit >= 0 ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    ¥{fundProfit.toFixed(2)}
                  </div>
                </div>
              )}

              {activeTab !== 'global' && futureProfit !== undefined && (
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${
                    darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                  } border ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  } whitespace-nowrap`}
                >
                  <div className="font-medium text-xs text-gray-500">期货收益</div>
                  <div
                    className={`font-bold text-sm ${
                      futureProfit >= 0 ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    ¥{futureProfit.toFixed(2)}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 右侧控制元素 - 宽度不足时完全隐藏 */}
          {showRightControls && (
            <>
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

              {/* 刷新开关 - 仅在股票页面显示 */}
              {activeTab === 'stock' && (
                <div
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    darkMode ? 'bg-black/10' : 'bg-black/5'
                  } ${!isMarketOpen ? 'opacity-60' : ''} transition-all duration-300 whitespace-nowrap`}
                >
                <Activity
                  className={`w-3.5 h-3.5 transition-colors duration-300 ${
                    isRefreshing
                      ? 'text-green-500'
                      : !isMarketOpen
                        ? 'text-orange-500'
                        : 'text-gray-500'
                  }`}
                />
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
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

