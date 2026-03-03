import React from 'react'
import { Trash2 } from 'lucide-react'

interface Stock {
  id: string
  symbol: string
  name: string
  costPrice: number
  quantity: number
}

interface StockQuote {
  price?: number
}

interface StockCardProps {
  darkMode: boolean
  stock: Stock
  quote?: StockQuote
  onDelete: (id: string) => void
}

export const StockCard: React.FC<StockCardProps> = ({
  darkMode,
  stock,
  quote,
  onDelete
}) => {
  const currentPrice = quote?.price || 0
  const profit = currentPrice * stock.quantity - stock.costPrice * stock.quantity
  const profitRate = ((currentPrice - stock.costPrice) / stock.costPrice) * 100

  return (
    <div className={`rounded-lg p-4 shadow-sm ${
      darkMode 
        ? 'bg-gray-800/50 border border-gray-700/50' 
        : 'bg-white/50 border border-gray-200/50'
    } backdrop-blur-sm`}>
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            currentPrice >= stock.costPrice ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div>
            <h3 className="font-semibold">{stock.name}</h3>
            <p className="text-sm text-gray-500">{stock.symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">当前价</div>
          <div className="font-bold text-lg">¥{currentPrice.toFixed(2)}</div>
        </div>
      </div>
      
      {/* 详细数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-500">买入价</div>
          <div className="font-medium">¥{stock.costPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">数量</div>
          <div className="font-medium">{stock.quantity}</div>
        </div>
        <div>
          <div className="text-gray-500">收益</div>
          <div className={`font-bold ${
            profit >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            ¥{profit.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-gray-500">收益率</div>
          <div className={`font-bold ${
            profitRate >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {profitRate.toFixed(2)}%
          </div>
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex justify-end mt-3 space-x-2">
        <button
          onClick={() => onDelete(stock.id)}
          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs rounded-md transition-colors flex items-center space-x-1"
        >
          <Trash2 className="w-3 h-3" />
          <span>删除</span>
        </button>
      </div>
    </div>
  )
}
