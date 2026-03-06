import React from 'react'
import { PieChart, LayoutGrid, List } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useStore } from '../../store'
import { DraggableFundCard } from './DraggableFundCard'
import { DraggableFundRow } from './DraggableFundRow'

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
    fundViewMode,
    setFundViewMode,
    reorderFunds,
  } = useStore()

  const filteredFunds = selectedFundGroup 
    ? funds.filter(f => f.groupId === selectedFundGroup)
    : []

  const [localFunds, setLocalFunds] = React.useState(filteredFunds)
  const [showMenuId, setShowMenuId] = React.useState<string | null>(null)
  const [showMoveMenuId, setShowMoveMenuId] = React.useState<string | null>(null)

  // 排序状态
  type SortField = 'code' | 'name' | 'shares' | 'costNav' | 'currentNav' | 'marketValue' | 'profit' | null
  type SortDirection = 'asc' | 'desc'
  const [sortField, setSortField] = React.useState<SortField>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc')

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 排序函数
  const sortFunds = React.useCallback((fundsArray: any[], field: SortField, direction: SortDirection) => {
    if (!field) return fundsArray

    return [...fundsArray].sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (field) {
        case 'code':
          aValue = a.code
          bValue = b.code
          break
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'shares':
          aValue = a.shares
          bValue = b.shares
          break
        case 'costNav':
          aValue = a.costNav
          bValue = b.costNav
          break
        case 'currentNav':
          aValue = fundQuotes[a.code]?.nav || 0
          bValue = fundQuotes[b.code]?.nav || 0
          break
        case 'marketValue':
          aValue = (fundQuotes[a.code]?.nav || 0) * a.shares
          bValue = (fundQuotes[b.code]?.nav || 0) * b.shares
          break
        case 'profit':
          aValue = ((fundQuotes[a.code]?.nav || 0) * a.shares) - (a.costNav * a.shares)
          bValue = ((fundQuotes[b.code]?.nav || 0) * b.shares) - (b.costNav * b.shares)
          break
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue, 'zh-CN')
          : bValue.localeCompare(aValue, 'zh-CN')
      }

      return direction === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })
  }, [fundQuotes])

  // 处理表头点击排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同一字段：切换方向或取消排序
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortField(null)
        setSortDirection('asc')
      }
    } else {
      // 新字段：设置为升序
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 同步外部数据变化并应用排序
  React.useEffect(() => {
    const sorted = sortFunds(filteredFunds, sortField, sortDirection)
    setLocalFunds(sorted)
  }, [filteredFunds, sortField, sortDirection, sortFunds])

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLocalFunds((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // 通知 store 保存新顺序
        reorderFunds(newItems.map((item) => item.id))
        
        return newItems
      })
    }
  }

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
          }`}>请先在左侧创建并选择一个基金分组，然后通过“搜索并添加基金”功能添加您的第一支基金，买入净值为持仓成本价，数量为持有份额。</p>
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
        <div className="flex items-center gap-3">
          {/* 视图模式切换 */}
          <div className={`flex items-center rounded-md overflow-hidden border ${
            darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
          }`}>
            <button
              onClick={() => setFundViewMode('card')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                fundViewMode === 'card'
                  ? darkMode
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500 text-white'
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
              onClick={() => setFundViewMode('list')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                fundViewMode === 'list'
                  ? darkMode
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500 text-white'
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
          
          <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${
            darkMode ? 'bg-gray-800/50' : 'bg-white/50'
          } border ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="text-xs text-gray-500">持仓数量</div>
            <div className="font-bold text-blue-500">{filteredFunds.length}</div>
          </div>
        </div>
      </div>

      {/* 基金列表 - 卡片或列表视图 */}
      {/* 拖拽上下文 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localFunds.map((f) => f.id)}
          strategy={fundViewMode === 'card' ? rectSortingStrategy : verticalListSortingStrategy}
        >
          {fundViewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {localFunds.map(fund => (
                <DraggableFundCard
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
          ) : (
            localFunds.length > 0 && (
              <div className={`rounded-lg overflow-hidden border ${
                darkMode ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-white/50'
              } backdrop-blur-sm`}>
                {/* 表头 */}
                <div className={`grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold ${
                  darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                }`}>
                  <div className="col-span-1"></div>
                  <div className="col-span-2 cursor-pointer" onClick={() => handleSort('code')}>
                    基金代码
                    {sortField === 'code' && (
                      <span className={`ml-1 text-xs ${sortDirection === 'asc' ? 'text-blue-500' : 'text-red-500'}`}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 cursor-pointer" onClick={() => handleSort('name')}>
                    基金名称
                    {sortField === 'name' && (
                      <span className={`ml-1 text-xs ${sortDirection === 'asc' ? 'text-blue-500' : 'text-red-500'}`}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-right cursor-pointer" onClick={() => handleSort('shares')}>
                    持仓份额
                    {sortField === 'shares' && (
                      <span className={`ml-1 text-xs ${sortDirection === 'asc' ? 'text-blue-500' : 'text-red-500'}`}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-right cursor-pointer" onClick={() => handleSort('costNav')}>
                    成本净值
                    {sortField === 'costNav' && (
                      <span className={`ml-1 text-xs ${sortDirection === 'asc' ? 'text-blue-500' : 'text-red-500'}`}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-right cursor-pointer" onClick={() => handleSort('currentNav')}>
                    当前净值
                    {sortField === 'currentNav' && (
                      <span className={`ml-1 text-xs ${sortDirection === 'asc' ? 'text-blue-500' : 'text-red-500'}`}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right cursor-pointer" onClick={() => handleSort('marketValue')}>
                    市值
                    {sortField === 'marketValue' && (
                      <span className={`ml-1 text-xs ${sortDirection === 'asc' ? 'text-blue-500' : 'text-red-500'}`}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right cursor-pointer" onClick={() => handleSort('profit')}>
                    收益
                    {sortField === 'profit' && (
                      <span className={`ml-1 text-xs ${sortDirection === 'asc' ? 'text-blue-500' : 'text-red-500'}`}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-center">操作</div>
                </div>
                {/* 表格内容 */}
                <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {localFunds.map(fund => (
                    <DraggableFundRow
                      key={fund.id}
                      darkMode={darkMode}
                      fund={fund}
                      quote={fundQuotes[fund.code]}
                      groups={fundGroups}
                      showMenu={showMenuId === fund.id}
                      showMoveMenu={showMoveMenuId === fund.id}
                      onToggleMenu={(e) => {
                        e.stopPropagation?.()
                        setShowMenuId(showMenuId === fund.id ? null : fund.id)
                      }}
                      onToggleMoveMenu={() => {
                        setShowMoveMenuId(showMoveMenuId === fund.id ? null : fund.id)
                      }}
                      onDelete={deleteFund}
                      onEdit={onEditFund}
                      onMove={moveFundToGroup}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </SortableContext>
      </DndContext>
    </div>
  )
}
