import React from 'react'
import { Trash2, MoreVertical, FolderInput } from 'lucide-react'

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

interface Group {
  id: string
  name: string
}

interface StockCardProps {
  darkMode: boolean
  stock: Stock
  quote?: StockQuote
  groups: Group[]
  onDelete: (id: string) => void
  onMove: (stockId: string, groupId: string) => void
}

export const StockCard: React.FC<StockCardProps> = ({
  darkMode,
  stock,
  quote,
  groups,
  onDelete,
  onMove
}) => {
  const [showMenu, setShowMenu] = React.useState(false)
  const currentPrice = quote?.price || 0
  const profit = currentPrice * stock.quantity - stock.costPrice * stock.quantity
  const profitRate = ((currentPrice - stock.costPrice) / stock.costPrice) * 100

  return (
    <div className={`rounded-lg p-4 shadow-sm relative ${
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
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">当前价</div>
            <div className="font-bold text-lg">¥{currentPrice.toFixed(2)}</div>
          </div>
          
          {/* 操作按钮 */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
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
      
      {/* 操作菜单 */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className={`absolute right-0 top-full mt-2 w-32 rounded-lg shadow-lg z-20 overflow-hidden border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {/* 移动到分组 */}
            <div className="relative group">
              <button className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}>
                <FolderInput className="w-3.5 h-3.5" />
                <span>移动到</span>
              </button>
              <div className={`hidden group-hover:block absolute left-full top-0 ml-1 w-40 rounded-lg shadow-lg z-20 overflow-hidden border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      onMove(stock.id, group.id)
                      setShowMenu(false)
                    }}
                    className={`w-full px-3 py-2 text-sm text-left ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 删除 */}
            <button
              onClick={() => {
                if (confirm(`确定要删除${stock.name}吗？`)) {
                  onDelete(stock.id)
                  setShowMenu(false)
                }
              }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 text-red-500 ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
