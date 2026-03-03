import React from 'react'
import { Trash2, MoreVertical, FolderInput } from 'lucide-react'
import { Fund, FundQuote, FundGroup } from '../../shared/types'

interface FundCardProps {
  darkMode: boolean
  fund: Fund
  quote?: FundQuote
  groups: FundGroup[]
  onDelete: (id: string) => void
  onMove: (fundId: string, groupId: string) => void
}

export const FundCard: React.FC<FundCardProps> = ({
  darkMode,
  fund,
  quote,
  groups,
  onDelete,
  onMove
}) => {
  const [showMenu, setShowMenu] = React.useState(false)
  const [showMoveMenu, setShowMoveMenu] = React.useState(false)
  
  const currentNav = quote?.nav || 0
  const profit = currentNav * fund.shares - fund.costNav * fund.shares
  const profitRate = fund.costNav !== 0 ? ((currentNav - fund.costNav) / fund.costNav) * 100 : 0

  return (
    <div 
      className={`rounded-lg p-4 shadow-sm relative ${
        darkMode 
          ? 'bg-gray-800/50 border border-gray-700/50' 
          : 'bg-white/50 border border-gray-200/50'
      } backdrop-blur-sm`}
    >
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            currentNav >= fund.costNav ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div>
            <h3 className="font-semibold">{fund.name}</h3>
            <p className="text-sm text-gray-500">{fund.code}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">当前净值</div>
            <div className="font-bold text-lg">{currentNav ? currentNav.toFixed(4) : '-'}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
              if (showMenu) setShowMoveMenu(false)
            }}
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
          <div className="text-gray-500">单位成本</div>
          <div className="font-medium">¥{fund.costNav?.toFixed(4) || '-'}
          </div>
        </div>
        <div>
          <div className="text-gray-500">持有份额</div>
          <div className="font-medium">{fund.shares?.toFixed(2) || '-'}
          </div>
        </div>
        <div>
          <div className="text-gray-500">收益</div>
          <div className={`font-bold ${
            profit >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {profit ? '¥' + profit.toFixed(2) : '-'}
          </div>
        </div>
        <div>
          <div className="text-gray-500">收益率</div>
          <div className={`font-bold ${
            profitRate >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {profitRate ? profitRate.toFixed(2) + '%' : '-'}  
          </div>
        </div>
      </div>
      
      {/* 操作菜单 */}
      {showMenu && (
        <div 
          className={`absolute right-0 top-full mt-2 w-32 rounded-lg shadow-lg z-20 overflow-hidden border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 移动到分组 */}
          <div className="relative">
            <button 
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FolderInput className="w-3.5 h-3.5" />
                <span>移动到</span>
              </div>
            </button>
            {showMoveMenu && (
              <div className={`absolute left-full top-0 ml-1 w-40 rounded-lg shadow-lg z-20 overflow-hidden border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      onMove(fund.id, group.id)
                      setShowMenu(false)
                      setShowMoveMenu(false)
                    }}
                    className={`w-full px-3 py-2 text-sm text-left ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 删除 */}
          <button
            onClick={() => {
              if (confirm(`确定要删除${fund.name}吗？`)) {
                onDelete(fund.id)
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
      )}
    </div>
  )
}
