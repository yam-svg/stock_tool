import React from 'react'
import { Trash2, MoreVertical, FolderInput, Edit2 } from 'lucide-react'
import { Fund, FundQuote, FundGroup } from '../../../shared/types'
import { isFundQuoteUpdatedToday } from '../../utils/fundQuote'

interface FundCardProps {
  darkMode: boolean
  fund: Fund
  quote?: FundQuote
  groups: FundGroup[]
  onDelete: (id: string) => void
  onEdit: (fund: Fund) => void
  onMove: (fundId: string, groupId: string) => void
}

export const FundCard: React.FC<FundCardProps> = ({
  darkMode,
  fund,
  quote,
  groups,
  onDelete,
  onEdit,
  onMove
}) => {
  const [showMenu, setShowMenu] = React.useState(false)
  const [showMoveMenu, setShowMoveMenu] = React.useState(false)
  const [flashColor, setFlashColor] = React.useState<'red' | 'green' | null>(null)
  const prevNavRef = React.useRef<number>(quote?.nav || 0)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // 净值更新闪烁效果
  React.useEffect(() => {
    const currentNav = quote?.nav || 0
    if (currentNav !== prevNavRef.current && prevNavRef.current !== 0) {
      if (currentNav > prevNavRef.current) {
        setFlashColor('red')
      } else if (currentNav < prevNavRef.current) {
        setFlashColor('green')
      }

      const timer = setTimeout(() => {
        setFlashColor(null)
      }, 1500)
      return () => clearTimeout(timer)
    }
    prevNavRef.current = currentNav
  }, [quote?.nav])

  // 点击外部关闭菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
        setShowMoveMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])
  
  const currentNav = quote?.nav || 0
  const profit = currentNav * fund.shares - fund.costNav * fund.shares
  const profitRate = fund.costNav !== 0 ? ((currentNav - fund.costNav) / fund.costNav) * 100 : 0
  const previousNav = currentNav ? currentNav - (quote?.change || 0) : 0
  const updateTimeText = quote?.updateTime || '-'
  const isUpdatedToday = isFundQuoteUpdatedToday(quote, fund)

  return (
    <div 
      className={`rounded-lg p-3 shadow-sm relative transition-colors duration-500 ${
        flashColor === 'red' 
          ? 'bg-red-500/20' 
          : flashColor === 'green' 
          ? 'bg-green-500/20' 
          : darkMode 
          ? 'bg-gray-800/50' 
          : 'bg-white/50'
      } border ${
        darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
      } backdrop-blur-sm`}
    >
      {isUpdatedToday && (
        <div className="absolute -top-2 right-14 z-10 rotate-6 pointer-events-none">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shadow ${
            darkMode ? 'bg-green-500/85 text-white' : 'bg-green-500 text-white'
          }`}>
            今日已更新
          </span>
        </div>
      )}

      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            currentNav >= fund.costNav ? 'bg-red-500' : 'bg-green-500'
          }`}></div>
          <div>
            <h3 className="font-semibold text-sm">{fund.name}</h3>
            <p className="text-xs text-gray-500">
              {fund.code}
              {fund.fundType && ` · ${fund.fundType}`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-xs text-gray-500">当前净值</div>
            <div className={`font-bold text-base ${
              (quote?.change || 0) >= 0 ? 'text-red-500' : 'text-green-500'
            }`}>
              {currentNav ? currentNav.toFixed(4) : '-'}
            </div>
            <div className="text-[11px] text-gray-500">更新时间 {updateTimeText}</div>
          </div>
          
          <div className="relative" ref={menuRef}>
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
                {/* 编辑 */}
                <button
                  onClick={() => {
                    onEdit(fund);
                    setShowMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>编辑</span>
                </button>

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
        </div>
      </div>

      {/* 详细数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-gray-500">单位成本</div>
          <div className="font-medium">¥{fund.costNav?.toFixed(4) || '-'}</div>
        </div>
        <div>
          <div className="text-gray-500">持有份额</div>
          <div className="font-medium">{fund.shares?.toFixed(2) || '-'}</div>
        </div>
        <div>
          <div className="text-gray-500">收益</div>
          <div
            className={`font-bold ${
              profit >= 0 ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {profit ? '¥' + profit.toFixed(2) : '-'}
          </div>
        </div>
        <div>
          <div className="text-gray-500">收益率</div>
          <div
            className={`font-bold ${
              profitRate >= 0 ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {profitRate ? profitRate.toFixed(2) + '%' : '-'}
          </div>
        </div>
        <div>
          <div className="text-gray-500">昨日净值</div>
          <div className="font-medium">
            {previousNav ? previousNav.toFixed(4) : '-'}
          </div>
        </div>
        <div>
          <div className="text-gray-500">当日涨跌幅</div>
          <div
            className={`font-bold ${
              (quote?.changePercent || 0) >= 0 ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {quote?.changePercent ? quote.changePercent.toFixed(2) + '%' : '-'}
          </div>
        </div>
      </div>
    </div>
  )
}
