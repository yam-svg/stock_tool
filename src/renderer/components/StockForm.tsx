import React from 'react'
import { Plus } from 'lucide-react'

interface StockGroup {
  id: string
  name: string
}

interface NewStockData {
  code: string
  name: string
  buyPrice: number
  quantity: number
  groupId: string
}

interface StockFormProps {
  darkMode: boolean
  newStock: NewStockData
  stockGroups: StockGroup[]
  onStockChange: (updates: Partial<NewStockData>) => void
  onAddStock: () => void
}

export const StockForm: React.FC<StockFormProps> = ({
  darkMode,
  newStock,
  stockGroups,
  onStockChange,
  onAddStock
}) => {
  return (
    <div className={`rounded-lg p-4 shadow-md ${
      darkMode 
        ? 'bg-gray-800/50 border border-gray-700/50' 
        : 'bg-white/50 border border-gray-200/50'
    } backdrop-blur-sm`}>
      <div className="flex items-center space-x-2 mb-4">
        <Plus className="w-4 h-4 text-green-500" />
        <h3 className="text-sm font-semibold">添加股票</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 股票代码 */}
        <div className="space-y-1">
          <label className={`text-xs font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>股票代码</label>
          <div className={`relative rounded-md ${
            darkMode ? 'bg-gray-700/50' : 'bg-white/50'
          } border ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <input
              type="text"
              value={newStock.code}
              onChange={(e) => onStockChange({ code: e.target.value })}
              placeholder="如：000001"
              className={`w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-transparent text-white placeholder-gray-400' 
                  : 'bg-transparent text-gray-800 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        
        {/* 股票名称 */}
        <div className="space-y-1">
          <label className={`text-xs font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>股票名称</label>
          <div className={`relative rounded-md ${
            darkMode ? 'bg-gray-700/50' : 'bg-white/50'
          } border ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <input
              type="text"
              value={newStock.name}
              onChange={(e) => onStockChange({ name: e.target.value })}
              placeholder="如：平安银行"
              className={`w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-transparent text-white placeholder-gray-400' 
                  : 'bg-transparent text-gray-800 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        
        {/* 买入价格 */}
        <div className="space-y-1">
          <label className={`text-xs font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>买入价格</label>
          <div className={`relative rounded-md ${
            darkMode ? 'bg-gray-700/50' : 'bg-white/50'
          } border ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <input
              type="number"
              step="0.01"
              value={newStock.buyPrice}
              onChange={(e) => onStockChange({ buyPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className={`w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-transparent text-white placeholder-gray-400' 
                  : 'bg-transparent text-gray-800 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
        
        {/* 持仓数量 */}
        <div className="space-y-1">
          <label className={`text-xs font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>持仓数量</label>
          <div className={`relative rounded-md ${
            darkMode ? 'bg-gray-700/50' : 'bg-white/50'
          } border ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <input
              type="number"
              value={newStock.quantity}
              onChange={(e) => onStockChange({ quantity: parseInt(e.target.value) || 0 })}
              placeholder="100"
              className={`w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-transparent text-white placeholder-gray-400' 
                  : 'bg-transparent text-gray-800 placeholder-gray-500'
              }`}
            />
          </div>
        </div>
      </div>
      
      {/* 分组选择和添加按钮 */}
      <div className="flex items-center space-x-3 mt-4">
        <select
          value={newStock.groupId}
          onChange={(e) => onStockChange({ groupId: e.target.value })}
          className={`px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode 
              ? 'bg-gray-700/50 border-gray-600 text-white' 
              : 'bg-white/50 border-gray-200 text-gray-800'
          }`}
        >
          <option value="">选择分组</option>
          {stockGroups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
        <button
          onClick={onAddStock}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 text-sm rounded-md font-medium transition-all duration-200 flex items-center space-x-1 shadow hover:shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加股票</span>
        </button>
      </div>
    </div>
  )
}
