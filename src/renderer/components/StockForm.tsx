import React from 'react'
import { Plus } from 'lucide-react'
import { Button, Input } from '../ui'

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
  isAdding?: boolean
  errors?: Record<string, string>
}

export const StockForm: React.FC<StockFormProps> = ({
  darkMode,
  newStock,
  stockGroups,
  onStockChange,
  onAddStock,
  isAdding = false,
  errors = {}
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
        <Input
          label="股票代码"
          value={newStock.code}
          onChange={(e) => onStockChange({ code: e.target.value })}
          placeholder="如：000001"
          darkMode={darkMode}
          error={errors.code}
        />
        
        {/* 股票名称 */}
        <Input
          label="股票名称"
          value={newStock.name}
          onChange={(e) => onStockChange({ name: e.target.value })}
          placeholder="如：平安银行"
          darkMode={darkMode}
          error={errors.name}
        />
        
        {/* 买入价格 */}
        <Input
          label="买入价格"
          type="number"
          step="0.01"
          value={newStock.buyPrice}
          onChange={(e) => onStockChange({ buyPrice: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
          darkMode={darkMode}
          error={errors.buyPrice}
        />
        
        {/* 持仓数量 */}
        <Input
          label="持仓数量"
          type="number"
          value={newStock.quantity}
          onChange={(e) => onStockChange({ quantity: parseInt(e.target.value) || 0 })}
          placeholder="100"
          darkMode={darkMode}
          error={errors.quantity}
        />
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
        <Button
          variant="success"
          size="sm"
          onClick={onAddStock}
          isLoading={isAdding}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          添加股票
        </Button>
      </div>
    </div>
  )
}
