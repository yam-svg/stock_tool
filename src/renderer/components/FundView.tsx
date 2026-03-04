import React from 'react'
import { PieChart } from 'lucide-react'
import { useStore } from '../store'
import { FundCard } from './FundCard'

interface FundViewProps {
  darkMode: boolean;
  onEditFund: (fund: any) => void;
}

export const FundView: React.FC<FundViewProps> = ({ darkMode, onEditFund }) => {
  const { 
    funds, 
    fundQuotes, 
    fundGroups, 
    selectedFundGroup,
    deleteFund,
    moveFundToGroup,
  } = useStore()

  const filteredFunds = selectedFundGroup 
    ? funds.filter(f => f.groupId === selectedFundGroup)
    : []

  if (funds.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className={`inline-flex p-4 rounded-full mb-4 ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
          }`}>
            <PieChart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">暂无基金持仓</h3>
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>点击上方表单或左侧分组添加您的第一支基金</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold">基金持仓</h2>
        </div>
        <div className={`px-3 py-1 rounded-md text-sm ${
          darkMode ? 'bg-gray-800/50' : 'bg-white/50'
        } border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="text-xs text-gray-500">持仓数量</div>
          <div className="font-bold text-blue-500">{filteredFunds.length}</div>
        </div>
      </div>

      {/* 当分组为空时显示表单 */}
      {!(selectedFundGroup && filteredFunds.length > 0) && (
        <FundForm
          darkMode={darkMode}
          newFund={newFund}
          fundGroups={fundGroups}
          onFundChange={(updates) => setNewFund({ ...newFund, ...updates })}
          onAddFund={handleAddFund}
          isAdding={isAdding}
          errors={errors}
        />
      )}

      <div className="space-y-3">
        {filteredFunds.map(fund => (
              <FundCard
                key={fund.id}
                darkMode={darkMode}
                fund={fund}
                quote={fundQuotes[fund.code]}
                groups={fundGroups}
                onDelete={deleteFund}
                onEdit={onEditFund}
                onMove={moveFundToGroup}
              />
            ))}
      </div>
    </div>
  )
}
