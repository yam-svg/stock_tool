import React from 'react'
import { Stock, StockGroup, StockQuote } from '../../../shared/types'
import { StockActionMenu } from './StockActionMenu'

interface StockListProps {
  darkMode: boolean;
  stocks: Stock[];
  quotes: Record<string, StockQuote>;
  groups: StockGroup[];
  onDelete: (id: string) => void;
  onEdit: (stock: Stock) => void;
  onMove: (stockId: string, groupId: string) => void;
}

export const StockList: React.FC<StockListProps> = ({
  darkMode,
  stocks,
  quotes,
  groups,
  onDelete,
  onEdit,
  onMove,
}) => {
  const [showMenuId, setShowMenuId] = React.useState<string | null>(null)
  const [flashColors, setFlashColors] = React.useState<Record<string, 'red' | 'green'>>({})
  const prevPricesRef = React.useRef<Record<string, number>>({})
  // 价格更新闪烁效果
  React.useEffect(() => {
    const newFlashColors: Record<string, 'red' | 'green'> = {}
    stocks.forEach((stock) => {
      const currentPrice = quotes[stock.symbol]?.price || 0
      const prevPrice = prevPricesRef.current[stock.symbol] || currentPrice
      if (currentPrice !== prevPrice && prevPrice !== 0) {
        if (currentPrice > prevPrice) {
          newFlashColors[stock.id] = 'red'
        } else if (currentPrice < prevPrice) {
          newFlashColors[stock.id] = 'green'
        }
      }
      prevPricesRef.current[stock.symbol] = currentPrice
    })
    if (Object.keys(newFlashColors).length > 0) {
      setFlashColors(newFlashColors)
      const timer = setTimeout(() => {
        setFlashColors({})
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [stocks, quotes])
  
  return (
    <div
      className={`rounded-lg border ${
        darkMode ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-white/50'
      } backdrop-blur-sm`}
    >
      {/* 表头 */}
      <div
        className={`grid gap-4 px-4 py-3 text-xs font-semibold ${
          darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
        }`}
        style={{
          gridTemplateColumns: '1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 1.2fr 0.6fr',
        }}
      >
        <div>股票代码</div>
        <div>股票名称</div>
        <div className="text-right">持仓数量</div>
        <div className="text-right">成本价</div>
        <div className="text-right">当前价</div>
        <div className="text-right">涨跌额</div>
        <div className="text-right">涨跌幅</div>
        <div className="text-right">市值</div>
        <div className="text-right">收益</div>
        <div className="text-center">操作</div>
      </div>
      {/* 表格内容 */}
      <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {stocks.map((stock) => {
          const quote = quotes[stock.symbol]
          const currentPrice = quote?.price || 0
          const cost = stock.costPrice * stock.quantity
          const marketValue = currentPrice * stock.quantity
          const profit = marketValue - cost
          const profitRate = stock.costPrice !== 0
            ? ((currentPrice - stock.costPrice) / stock.costPrice) * 100
            : 0
          const priceChange = quote?.change || 0
          const changePercent = quote?.changePercent || 0
          const flashColor = flashColors[stock.id]
          const hasPosition = stock.quantity > 0
          return (
            <div
              key={stock.id}
              className={`grid gap-4 px-4 py-3 text-sm transition-colors duration-500 relative ${
                flashColor === 'red'
                  ? darkMode
                    ? 'bg-red-500/20'
                    : 'bg-red-50/50'
                  : flashColor === 'green'
                    ? darkMode
                      ? 'bg-green-500/20'
                      : 'bg-green-50/50'
                    : darkMode
                      ? 'hover:bg-gray-700/30'
                      : 'hover:bg-gray-50/50'
              }`}
              style={{
                gridTemplateColumns: '1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 1.2fr 0.6fr',
              }}
            >
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    currentPrice >= stock.costPrice ? 'bg-red-500' : 'bg-green-500'
                  }`}
                ></div>
                <span className="text-gray-500">{stock.symbol}</span>
              </div>
              <div className="font-medium">{stock.name}</div>
              <div className="text-right">{stock.quantity}</div>
              <div className="text-right">¥{stock.costPrice.toFixed(2)}</div>
              <div className={`text-right font-bold ${
                (quote?.change || 0) >= 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                ¥{currentPrice ? currentPrice.toFixed(4) : '-'}
              </div>
              <div className={`text-right font-bold ${
                priceChange >= 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {priceChange >= 0 ? '+' : ''}{priceChange ? priceChange.toFixed(4) : '-'}
              </div>
              <div className={`text-right font-bold ${
                changePercent >= 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {changePercent >= 0 ? '+' : ''}{changePercent ? changePercent.toFixed(2) : '-'}%
              </div>
              <div className="text-right">
                <div className="font-medium">{hasPosition ? `¥${marketValue.toFixed(2)}` : '-'}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${profit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {hasPosition ? `¥${profit.toFixed(2)}` : '-'}
                </div>
                <div
                  className={`text-xs ${
                    profitRate >= 0 ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {hasPosition
                    ? `${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%`
                    : '-'}
                </div>
              </div>
              <div className="flex justify-center items-center">
                <StockActionMenu
                  darkMode={darkMode}
                  stock={stock}
                  groups={groups}
                  isOpen={showMenuId === stock.id}
                  onToggle={(e) => {
                    e.stopPropagation?.()
                    setShowMenuId(showMenuId === stock.id ? null : stock.id)
                  }}
                  onEdit={onEdit}
                  onMove={onMove}
                  onDelete={onDelete}
                  menuPosition="absolute"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
