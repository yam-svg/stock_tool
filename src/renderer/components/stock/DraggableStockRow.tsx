import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Stock, StockQuote, StockGroup } from '../../../shared/types'
import { StockActionMenu } from './StockActionMenu'
import { GripVertical } from 'lucide-react'

interface DraggableStockRowProps {
  darkMode: boolean
  stock: Stock
  quote?: StockQuote
  groups: StockGroup[]
  showMenu: boolean
  flashColor: 'red' | 'green' | null
  onToggleMenu: (e: React.MouseEvent) => void
  onDelete: (id: string) => void
  onEdit: (stock: Stock) => void
  onMove: (stockId: string, groupId: string) => void
}

/**
 * 可拖拽的股票列表行组件
 */
export const DraggableStockRow: React.FC<DraggableStockRowProps> = ({
  darkMode,
  stock,
  quote,
  groups,
  showMenu,
  flashColor,
  onToggleMenu,
  onDelete,
  onEdit,
  onMove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stock.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const currentPrice = quote?.price || 0
  const cost = stock.costPrice * stock.quantity
  const marketValue = currentPrice * stock.quantity
  const profit = marketValue - cost
  const profitRate = stock.costPrice !== 0
    ? ((currentPrice - stock.costPrice) / stock.costPrice) * 100
    : 0
  const priceChange = quote?.change || 0
  const changePercent = quote?.changePercent || 0
  const hasPosition = stock.quantity > 0

  return (
    <div
      ref={setNodeRef}
      className={`grid gap-4 px-4 py-3 text-sm transition-colors duration-500 relative ${
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
        gridTemplateColumns: '40px 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 1.2fr 0.6fr',
      }}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className={`flex items-center justify-center cursor-grab active:cursor-grabbing ${
          darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <GripVertical size={16} />
      </div>

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
          isOpen={showMenu}
          onToggle={onToggleMenu}
          onEdit={onEdit}
          onMove={onMove}
          onDelete={onDelete}
          menuPosition="absolute"
        />
      </div>
    </div>
  )
}

