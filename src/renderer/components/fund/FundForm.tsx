import React from 'react'
import { Plus } from 'lucide-react'
import { Button, Input } from '../../ui'

interface FundGroup {
  id: string
  name: string
}

interface NewFundData {
  code: string
  name: string
  costNav: number
  shares: number
  groupId: string
}

interface FundFormProps {
  darkMode: boolean
  newFund: NewFundData
  fundGroups: FundGroup[]
  onFundChange: (updates: Partial<NewFundData>) => void
  onAddFund: () => void
  isAdding?: boolean
  errors?: Record<string, string>
}

export const FundForm: React.FC<FundFormProps> = ({
  darkMode,
  newFund,
  fundGroups,
  onFundChange,
  onAddFund,
  isAdding,
  errors = {}
}) => {
  return (
    <div className={`p-4 rounded-xl border ${
      darkMode 
        ? 'bg-gray-800/40 border-gray-700/50' 
        : 'bg-white/40 border-gray-200/50'
    } backdrop-blur-md shadow-sm`}>
      <h3 className="text-sm font-semibold mb-4 flex items-center space-x-2">
        <Plus className="w-4 h-4 text-green-500" />
        <span>快捷添加基金</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 基金代码 */}
        <Input
          label="基金代码"
          value={newFund.code}
          onChange={(e) => onFundChange({ code: e.target.value })}
          placeholder="如 000001"
          darkMode={darkMode}
          error={errors.code}
        />
        
        {/* 基金名称 */}
        <Input
          label="基金名称"
          value={newFund.name}
          onChange={(e) => onFundChange({ name: e.target.value })}
          placeholder="如 华夏成长混合"
          darkMode={darkMode}
          error={errors.name}
        />
        
        {/* 单位成本 */}
        <Input
          label="单位成本"
          type="number"
          value={newFund.costNav}
          onChange={(e) => onFundChange({ costNav: parseFloat(e.target.value) || 0 })}
          placeholder="0.0000"
          darkMode={darkMode}
          error={errors.costNav}
        />
        
        {/* 持有份额 */}
        <Input
          label="持有份额"
          type="number"
          value={newFund.shares}
          onChange={(e) => onFundChange({ shares: parseFloat(e.target.value) || 0 })}
          placeholder="1000.00"
          darkMode={darkMode}
          error={errors.shares}
        />
      </div>
      
      {/* 分组选择和添加按钮 */}
      <div className="flex items-center space-x-3 mt-4">
        <select
          value={newFund.groupId}
          onChange={(e) => onFundChange({ groupId: e.target.value })}
          className={`px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode 
              ? 'bg-gray-700/50 border-gray-600 text-white' 
              : 'bg-white/50 border-gray-200 text-gray-800'
          }`}
        >
          <option value="">选择分组</option>
          {fundGroups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
        <Button
          variant="success"
          size="sm"
          onClick={onAddFund}
          isLoading={isAdding}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          添加基金
        </Button>
      </div>
    </div>
  )
}
