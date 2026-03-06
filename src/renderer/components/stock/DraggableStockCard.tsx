import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Stock, StockQuote, StockGroup } from '../../../shared/types'
import { StockCard } from './StockCard'
import { GripVertical } from 'lucide-react'

interface DraggableStockCardProps {
  darkMode: boolean
  stock: Stock
  quote?: StockQuote
  groups: StockGroup[]
  onDelete: (id: string) => void
  onEdit: (stock: Stock) => void
  onMove: (stockId: string, groupId: string) => void
  onShowChart?: (symbol: string, name: string) => void
}

/**
 * 可拖拽的股票卡片组件
 */
export const DraggableStockCard: React.FC<DraggableStockCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.stock.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing ${
          props.darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <GripVertical size={16} />
      </div>
      
      {/* 卡片内容（左边距增加以容纳拖拽手柄） */}
      <div className="pl-6">
        <StockCard {...props} />
      </div>
    </div>
  )
}

