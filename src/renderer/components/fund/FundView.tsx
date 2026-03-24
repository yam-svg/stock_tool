import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { LayoutGrid, List, PieChart } from 'lucide-react'
import React from 'react'
import { useFundStore, useUIStore } from '../../store'
import { DraggableFundCard } from './DraggableFundCard'
import { FundList } from './FundList.tsx'
import { isSystemFundGroup } from '../../../shared/groupConstants'

interface FundViewProps {
  darkMode: boolean;
  onEditFund: (fund: any) => void;
}

export const FundView: React.FC<FundViewProps> = ({ darkMode, onEditFund }) => {
  // 使用单独的 store hooks，避免每次创建新对象
  const funds = useFundStore(state => state.funds)
  const fundQuotes = useFundStore(state => state.fundQuotes)
  const fundGroups = useFundStore(state => state.fundGroups)
  const selectedFundGroup = useFundStore(state => state.selectedFundGroup)
  const deleteFund = useFundStore(state => state.deleteFund)
  const moveFundToGroup = useFundStore(state => state.moveFundToGroup)
  const reorderFunds = useFundStore(state => state.reorderFunds)
  const fundViewMode = useUIStore(state => state.fundViewMode)
  const setFundViewMode = useUIStore(state => state.setFundViewMode)
  
  // 使用 useMemo 缓存 filteredFunds，避免每次渲染创建新数组
  const filteredFunds = React.useMemo(() => {
    if (!selectedFundGroup) return []
    if (isSystemFundGroup(selectedFundGroup)) return funds
    return funds.filter(f => f.groupId === selectedFundGroup)
  }, [funds, selectedFundGroup])
  
  const [localFunds, setLocalFunds] = React.useState(filteredFunds)
  const totalPositionShares = React.useMemo(
    () => filteredFunds.reduce((sum, fund) => sum + (fund.shares || 0), 0),
    [filteredFunds]
  )
  
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
    }),
  )
  
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
  
  // 使用 useMemo 缓存排序结果，避免无限循环
  const sortedFunds = React.useMemo(() => {
    if (!sortField) return filteredFunds
    
    return [...filteredFunds].sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0
      
      switch (sortField) {
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
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue, 'zh-CN')
          : bValue.localeCompare(aValue, 'zh-CN')
      }
      
      return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })
  }, [filteredFunds, sortField, sortDirection, fundQuotes])
  
  // 同步排序结果到 localFunds
  React.useEffect(() => {
    setLocalFunds(sortedFunds)
  }, [sortedFunds])
  
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
            <div className="font-bold text-blue-500">{totalPositionShares.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      {/* 基金列表 - 卡片或列表视图 */}
      {fundViewMode === 'card' ? (
        // 卡片模式：支持拖拽
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localFunds.map((f) => f.id)}
            strategy={rectSortingStrategy}
          >
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
          </SortableContext>
        </DndContext>
      ) : (
        // 列表模式：统一使用 FundList 组件
        localFunds.length > 0 && (
          <FundList
            darkMode={darkMode}
            funds={localFunds}
            quotes={fundQuotes}
            groups={fundGroups}
            onDelete={deleteFund}
            onEdit={onEditFund}
            onMove={moveFundToGroup}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            enableDrag={sortField === null}
            onDragEnd={handleDragEnd}
          />
        )
      )}
    </div>
  )
}
