import React from 'react'
import { GripVertical } from 'lucide-react'
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Fund, FundGroup, FundQuote } from '../../../shared/types'
import { FundActionMenu } from './FundActionMenu'

type SortField = 'code' | 'name' | 'shares' | 'costNav' | 'currentNav' | 'marketValue' | 'profit' | null
type SortDirection = 'asc' | 'desc'

interface FundListProps {
  darkMode: boolean
  funds: Fund[]
  quotes: Record<string, FundQuote>
  groups: FundGroup[]
  onDelete: (id: string) => void
  onEdit: (fund: Fund) => void
  onMove: (fundId: string, groupId: string) => void
  sortField?: SortField
  sortDirection?: SortDirection
  onSort?: (field: SortField) => void
  enableDrag?: boolean
  onDragEnd?: (event: DragEndEvent) => void
}

// 单行组件 - 定义在外部避免重新创建
interface FundRowProps {
  darkMode: boolean
  fund: Fund
  quotes: Record<string, FundQuote>
  groups: FundGroup[]
  isDraggable: boolean
  enableDrag: boolean
  showMenuId: string | null
  onToggleMenu: (fundId: string) => void
  onEdit: (fund: Fund) => void
  onMove: (fundId: string, groupId: string) => void
  onDelete: (id: string) => void
}

const FundRow: React.FC<FundRowProps> = React.memo(({
  darkMode,
  fund,
  quotes,
  groups,
  isDraggable,
  enableDrag,
  showMenuId,
  onToggleMenu,
  onEdit,
  onMove,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: fund.id, 
    disabled: !isDraggable 
  })

  const style = isDraggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : {}

  const quote = quotes[fund.code]
  const currentNav = quote?.nav || 0
  const updateTimeText = quote?.updateTime || '-'
  const cost = fund.costNav * fund.shares
  const marketValue = currentNav * fund.shares
  const profit = marketValue - cost
  const profitRate = fund.costNav !== 0
    ? ((currentNav - fund.costNav) / fund.costNav) * 100
    : 0

  return (
    <div
      ref={setNodeRef}
      className={`grid gap-4 px-4 py-3 text-sm transition-colors ${
        darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'
      }`}
      style={{
        ...style,
        gridTemplateColumns: enableDrag
          ? '40px 2fr 2fr 1fr 1fr 1fr 1fr 2fr 2fr 1fr'
          : '2fr 2fr 1fr 1fr 1fr 1fr 2fr 2fr 1fr',
      }}
    >
      {enableDrag && (
        <div
          {...attributes}
          {...listeners}
          className={`flex items-center justify-center cursor-grab active:cursor-grabbing ${
            darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <GripVertical size={16} />
        </div>
      )}
      <div className="flex items-center">
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            currentNav >= fund.costNav ? 'bg-red-500' : 'bg-green-500'
          }`}
        ></div>
        <span className="text-gray-500">{fund.code}</span>
      </div>
      <div className="font-medium">
        <div>{fund.name}</div>
        {fund.fundType && (
          <div className="text-xs text-gray-500">{fund.fundType}</div>
        )}
      </div>
      <div className="text-right">{fund.shares}</div>
      <div className="text-right">{fund.costNav.toFixed(4)}</div>
      <div className={`text-right font-bold ${
        (quote?.change || 0) >= 0 ? 'text-red-500' : 'text-green-500'
      }`}>
        {currentNav ? currentNav.toFixed(4) : '-'}
      </div>
      <div className={`text-right font-bold ${
        (quote?.changePercent || 0) >= 0 ? 'text-red-500' : 'text-green-500'
      }`}>
        {quote?.changePercent != null ? `${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%` : '-'}
        
        <div className="text-xs text-gray-500">更新时间：{updateTimeText}</div>
      </div>
      <div className="text-right">
        <div className="font-medium">¥{marketValue.toFixed(2)}</div>
      </div>
      <div className="text-right">
        <div className={`font-bold ${profit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
          ¥{profit.toFixed(2)}
        </div>
        <div
          className={`text-xs ${
            profitRate >= 0 ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {profitRate >= 0 ? '+' : ''}
          {profitRate.toFixed(2)}%
        </div>
      </div>
      <div className="flex justify-center items-center">
        <FundActionMenu
          darkMode={darkMode}
          fund={fund}
          groups={groups}
          isOpen={showMenuId === fund.id}
          onToggle={(e) => {
            e.stopPropagation?.()
            onToggleMenu(fund.id)
          }}
          onEdit={onEdit}
          onMove={onMove}
          onDelete={onDelete}
          menuPosition="absolute"
        />
      </div>
    </div>
  )
})

FundRow.displayName = 'FundRow'

export const FundList: React.FC<FundListProps> = ({
  darkMode,
  funds,
  quotes,
  groups,
  onDelete,
  onEdit,
  onMove,
  sortField = null,
  sortDirection = 'asc',
  onSort,
  enableDrag = false,
  onDragEnd,
}) => {
  const [showMenuId, setShowMenuId] = React.useState<string | null>(null)

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

  // 渲染表头单元格
  const renderHeaderCell = (label: string, field: SortField, align: 'left' | 'right' | 'center' = 'left') => {
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
    const isClickable = onSort && field

    if (!isClickable) {
      return <div className={alignClass}>{label}</div>
    }

    return (
      <div
        className={`${alignClass} cursor-pointer hover:text-blue-500 transition-colors flex items-center gap-1 ${
          align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''
        }`}
        onClick={() => onSort(field)}
      >
        {label}
        {sortField === field && (
          sortDirection === 'asc'
            ? <span className="text-blue-500">↑</span>
            : <span className="text-blue-500">↓</span>
        )}
      </div>
    )
  }

  const handleToggleMenu = React.useCallback((fundId: string) => {
    setShowMenuId(prev => prev === fundId ? null : fundId)
  }, [])

  const content = (
    <div
      className={`rounded-lg border ${
        darkMode ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-white/50'
      } backdrop-blur-sm`}
    >
      {/* 表头 */}
      <div
        className={`grid gap-4 px-4 py-3 text-xs font-semibold ${
          darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
        }`}
        style={{
          gridTemplateColumns: enableDrag
            ? '40px 2fr 2fr 1fr 1fr 1fr 1fr 2fr 2fr 1fr'
            : '2fr 2fr 1fr 1fr 1fr 1fr 2fr 2fr 1fr',
        }}
      >
        {enableDrag && <div></div>}
        <div>{renderHeaderCell('基金代码', 'code', 'left')}</div>
        <div>{renderHeaderCell('基金名称', 'name', 'left')}</div>
        <div>{renderHeaderCell('持仓份额', 'shares', 'right')}</div>
        <div>{renderHeaderCell('成本净值', 'costNav', 'right')}</div>
        <div>{renderHeaderCell('当前净值', 'currentNav', 'right')}</div>
        <div>{renderHeaderCell('涨跌幅', null, 'right')}</div>
        <div>{renderHeaderCell('市值', 'marketValue', 'right')}</div>
        <div>{renderHeaderCell('收益', 'profit', 'right')}</div>
        <div>{renderHeaderCell('操作', null, 'center')}</div>
      </div>
      {/* 表格内容 */}
      <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {funds.map((fund) =>
          <FundRow 
            key={fund.id} 
            darkMode={darkMode}
            fund={fund} 
            quotes={quotes}
            groups={groups}
            isDraggable={enableDrag}
            enableDrag={enableDrag}
            showMenuId={showMenuId}
            onToggleMenu={handleToggleMenu}
            onEdit={onEdit}
            onMove={onMove}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  )

  // 如果启用拖拽，包装在 DndContext 中
  if (enableDrag && onDragEnd) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={funds.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {content}
        </SortableContext>
      </DndContext>
    )
  }

  return content
}

