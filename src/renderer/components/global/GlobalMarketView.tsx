import React from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { GlobalIndexQuote } from '../../../shared/types'

interface GlobalMarketViewProps {
  darkMode: boolean
  indexes: GlobalIndexQuote[]
  viewMode: 'card' | 'list'
  setViewMode: (mode: 'card' | 'list') => void
}

export const GlobalMarketView: React.FC<GlobalMarketViewProps> = ({
  darkMode,
  indexes,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">全球市场</h2>
        <div
          className={`flex items-center rounded-md overflow-hidden border ${
            darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
          }`}
        >
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
              viewMode === 'card'
                ? 'bg-blue-500 text-white'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
            title="卡片视图"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>卡片</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
            title="列表视图"
          >
            <List className="w-4 h-4" />
            <span>列表</span>
          </button>
        </div>
      </div>

      {indexes.length === 0 ? (
        <div
          className={`rounded-xl border p-6 text-sm ${
            darkMode ? 'border-gray-700 bg-gray-800/40 text-gray-300' : 'border-gray-200 bg-white/70 text-gray-600'
          }`}
        >
          暂无全球市场数据
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5">
          {indexes.map((item) => (
            <div
              key={item.symbol}
              className={`rounded-md border px-3 py-2.5 ${
                darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/70'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold leading-5">{item.name}</div>
                  <div className="text-[11px] text-gray-500">{item.code}</div>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                    item.isOpen
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  {item.isOpen ? '开市' : '休市'}
                </span>
              </div>
              <div className="text-lg font-bold leading-6 mb-0.5">{item.value > 0 ? item.value.toFixed(2) : '-'}</div>
              <div className={`text-xs font-medium ${item.changePercent >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {item.value > 0 ? `${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%` : '-'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`rounded-lg border overflow-hidden ${
            darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/70'
          }`}
        >
          <div className={`grid gap-4 px-4 py-3 text-xs font-semibold ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`} style={{ gridTemplateColumns: '1.4fr 0.8fr 1fr 0.8fr 0.8fr' }}>
            <div>市场</div>
            <div>代码</div>
            <div className="text-right">指数值</div>
            <div className="text-right">涨跌幅</div>
            <div className="text-right">状态</div>
          </div>
          <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {indexes.map((item) => (
              <div key={item.symbol} className="grid gap-4 px-4 py-3 text-sm" style={{ gridTemplateColumns: '1.4fr 0.8fr 1fr 0.8fr 0.8fr' }}>
                <div className="font-medium">{item.name}</div>
                <div className="text-gray-500">{item.code}</div>
                <div className="text-right font-semibold">{item.value > 0 ? item.value.toFixed(2) : '-'}</div>
                <div className={`text-right font-semibold ${item.changePercent >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {item.value > 0 ? `${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%` : '-'}
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      item.isOpen
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {item.isOpen ? '开市' : '休市'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

