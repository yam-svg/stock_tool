import React from 'react'
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
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
import { Stock, StockGroup, StockQuote } from '../../../shared/types'
import { StockActionMenu } from './StockActionMenu'

type SortField = 'symbol' | 'name' | 'quantity' | 'costPrice' | 'currentPrice' | 'change' | 'changePercent' | 'marketValue' | 'profit' | null
type SortDirection = 'asc' | 'desc'

interface StockListProps {
  darkMode: boolean
  stocks: Stock[]
  quotes: Record<string, StockQuote>
  groups: StockGroup[]
  onDelete: (id: string) => void
  onEdit: (stock: Stock) => void
  onMove: (stockId: string, groupId: string) => void
  onShowChart?: (symbol: string, name: string) => void
  sortField?: SortField
  sortDirection?: SortDirection
  onSort?: (field: SortField) => void
  enableDrag?: boolean
  onDragEnd?: (event: DragEndEvent) => void
}

export const StockList: React.FC<StockListProps> = ({
  darkMode,
  stocks,
  quotes,
  groups,
  onDelete,
  onEdit,
  onMove,
  onShowChart,
  sortField = null,
  sortDirection = 'asc',
  onSort,
  enableDrag = false,
  onDragEnd,
}) => {
  const [showMenuId, setShowMenuId] = React.useState<string | null>(null)
  const [flashColors, setFlashColors] = React.useState<Record<string, 'red' | 'green'>>({})
  const prevPricesRef = React.useRef<Record<string, number>>({})
  
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
  
  // 价格更新闪烁效果
  React.useEffect(() => {
    const newFlashColors: Record<string, 'red' | 'green'> = {}
    stocks.forEach((stock) => {
      const currentPrice = quotes[stock.symbol]?.price || 0
      const prevPrice = prevPricesRef.current[stock.symbol] || currentPrice
      if (currentPrice !== prevPrice && prevPrice !== 0) {
        if (currentPrice > prevPrice) {
          newFlashColors[stock.id] = 'red'
        } else if (currentPrice < prevPrice) {
          newFlashColors[stock.id] = 'green'
        }
      }
      prevPricesRef.current[stock.symbol] = currentPrice
    })
    if (Object.keys(newFlashColors).length > 0) {
      setFlashColors(newFlashColors)
      const timer = setTimeout(() => {
        setFlashColors({})
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [stocks, quotes])

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
            ? <ArrowUp className="w-3 h-3 text-blue-500" />
            : <ArrowDown className="w-3 h-3 text-blue-500" />
        )}
      </div>
    )
  }

  // 单行组件
  const StockRow: React.FC<{ stock: Stock; isDraggable: boolean }> = ({ stock, isDraggable }) => {
    const sortableProps = useSortable({ id: stock.id, disabled: !isDraggable })
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortableProps

    const style = isDraggable ? {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    } : {}

    const quote = quotes[stock.symbol]
    const currentPrice = quote?.price || 0
    const cost = stock.costPrice * stock.quantity
    const marketValue = currentPrice * stock.quantity
    const profit = marketValue - cost
    const profitRate = stock.costPrice !== 0
      ? ((currentPrice - stock.costPrice) / stock.costPrice) * 100
      : 0
    const priceChange = quote?.change || 0
    const changePercent = quote?.changePercent || 0
    const flashColor = flashColors[stock.id]
    const hasPosition = stock.quantity > 0

    return (
      <div
        ref={setNodeRef}
        className={`grid gap-4 px-4 py-3 text-sm transition-colors duration-500 relative cursor-pointer ${
          flashColor === 'red'
            ? darkMode
              ? 'bg-red-500/20'
              : 'bg-red-50/50'
            : flashColor === 'green'
              ? darkMode
                ? 'bg-green-500/20'
                : 'bg-green-50/50'
              : darkMode
                ? 'hover:bg-gray-700/30'
                : 'hover:bg-gray-50/50'
        }`}
        style={{
          ...style,
          gridTemplateColumns: enableDrag ? '40px 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 1.2fr 0.6fr' : '1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 1.2fr 0.6fr',
        }}
        onClick={() => onShowChart?.(stock.symbol, stock.name)}
      >
        {enableDrag && (
          <div
            {...attributes}
            {...listeners}
            className={`flex items-center justify-center cursor-grab active:cursor-grabbing ${
              darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={16} />
          </div>
        )}
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              currentPrice >= stock.costPrice ? 'bg-red-500' : 'bg-green-500'
            }`}
          ></div>
          <span className="text-gray-500">{stock.symbol}</span>
        </div>
        <div className="font-medium">{stock.name}</div>
        <div className="text-right">{stock.quantity}</div>
        <div className="text-right">¥{stock.costPrice.toFixed(2)}</div>
        <div className={`text-right font-bold ${
          (quote?.change || 0) >= 0 ? 'text-red-500' : 'text-green-500'
        }`}>
          ¥{currentPrice ? currentPrice.toFixed(4) : '-'}
        </div>
        <div className={`text-right font-bold ${
          priceChange >= 0 ? 'text-red-500' : 'text-green-500'
        }`}>
          {priceChange >= 0 ? '+' : ''}{priceChange ? priceChange.toFixed(4) : '-'}
        </div>
        <div className={`text-right font-bold ${
          changePercent >= 0 ? 'text-red-500' : 'text-green-500'
        }`}>
          {changePercent >= 0 ? '+' : ''}{changePercent ? changePercent.toFixed(2) : '-'}%
        </div>
        <div className="text-right">
          <div className="font-medium">{hasPosition ? `¥${marketValue.toFixed(2)}` : '-'}</div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${profit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {hasPosition ? `¥${profit.toFixed(2)}` : '-'}
          </div>
          <div
            className={`text-xs ${
              profitRate >= 0 ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {hasPosition
              ? `${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%`
              : '-'}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <StockActionMenu
            darkMode={darkMode}
            stock={stock}
            groups={groups}
            isOpen={showMenuId === stock.id}
            onToggle={(e) => {
              e.stopPropagation?.()
              setShowMenuId(showMenuId === stock.id ? null : stock.id)
            }}
            onEdit={onEdit}
            onMove={onMove}
            onDelete={onDelete}
            menuPosition="absolute"
          />
        </div>
      </div>
    )
  }
  
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
          gridTemplateColumns: enableDrag ? '40px 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 1.2fr 0.6fr' : '1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 1.2fr 0.6fr',
        }}
      >
        {enableDrag && <div></div>}
        {renderHeaderCell('股票代码', 'symbol', 'left')}
        {renderHeaderCell('股票名称', 'name', 'left')}
        {renderHeaderCell('持仓数量', 'quantity', 'right')}
        {renderHeaderCell('成本价', 'costPrice', 'right')}
        {renderHeaderCell('当前价', 'currentPrice', 'right')}
        {renderHeaderCell('涨跌额', 'change', 'right')}
        {renderHeaderCell('涨跌幅', 'changePercent', 'right')}
        {renderHeaderCell('市值', 'marketValue', 'right')}
        {renderHeaderCell('收益', 'profit', 'right')}
        {renderHeaderCell('操作', null, 'center')}
      </div>
      {/* 表格内容 */}
      <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {stocks.map((stock) =>
          <StockRow key={stock.id} stock={stock} isDraggable={enableDrag} />
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
          items={stocks.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {content}
        </SortableContext>
      </DndContext>
    )
  }

  return content
}


