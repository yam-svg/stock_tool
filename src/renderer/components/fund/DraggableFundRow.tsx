import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Fund, FundQuote, FundGroup } from '../../../shared/types'
import { Trash2, Edit2, FolderInput, MoreVertical, GripVertical } from 'lucide-react'

interface DraggableFundRowProps {
  darkMode: boolean
  fund: Fund
  quote?: FundQuote
  groups: FundGroup[]
  showMenu: boolean
  showMoveMenu: boolean
  onToggleMenu: (e: React.MouseEvent) => void
  onToggleMoveMenu: () => void
  onDelete: (id: string) => void
  onEdit: (fund: Fund) => void
  onMove: (fundId: string, groupId: string) => void
}

/**
 * 可拖拽的基金列表行组件
 */
export const DraggableFundRow: React.FC<DraggableFundRowProps> = ({
  darkMode,
  fund,
  quote,
  groups,
  showMenu,
  showMoveMenu,
  onToggleMenu,
  onToggleMoveMenu,
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
  } = useSortable({ id: fund.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const currentNav = quote?.nav || 0
  const cost = fund.costNav * fund.shares
  const marketValue = currentNav * fund.shares
  const profit = marketValue - cost
  const profitRate = fund.costNav !== 0
    ? ((currentNav - fund.costNav) / fund.costNav) * 100
    : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:${
        darkMode ? 'bg-gray-700/30' : 'bg-gray-50/50'
      } transition-colors relative`}
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className={`col-span-1 flex items-center justify-center cursor-grab active:cursor-grabbing ${
          darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <GripVertical size={16} />
      </div>

      <div className="col-span-2 flex items-center">
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            currentNav >= fund.costNav ? 'bg-red-500' : 'bg-green-500'
          }`}
        ></div>
        <span className="text-gray-500">{fund.code}</span>
      </div>
      <div className="col-span-2 font-medium">
        <div>{fund.name}</div>
        {fund.fundType && (
          <div className="text-xs text-gray-500">{fund.fundType}</div>
        )}
      </div>
      <div className="col-span-1 text-right">{fund.shares}</div>
      <div className="col-span-1 text-right">¥{fund.costNav.toFixed(4)}</div>
      <div className={`col-span-1 text-right font-bold ${
        currentNav >= fund.costNav ? 'text-red-500' : 'text-green-500'
      }`}>
        ¥{currentNav ? currentNav.toFixed(4) : '-'}
      </div>
      <div className="col-span-2 text-right">
        <div className="font-medium">¥{marketValue.toFixed(2)}</div>
      </div>
      <div className="col-span-2 text-right">
        <div className={`font-bold ${profit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
          ¥{profit.toFixed(2)}
        </div>
        <div
          className={`text-xs ${
            profitRate >= 0 ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
        </div>
      </div>
      <div className="col-span-1 flex justify-center items-center relative">
        <button
          onClick={onToggleMenu}
          className={`p-1 rounded hover:${
            darkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}
        >
          <MoreVertical size={16} />
        </button>
        {showMenu && (
          <div
            className={`absolute right-0 top-8 z-50 w-32 rounded-lg shadow-lg border ${
              darkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <button
              onClick={() => onEdit(fund)}
              className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <Edit2 size={14} />
              <span>编辑</span>
            </button>
            <button
              onClick={onToggleMoveMenu}
              className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <FolderInput size={14} />
              <span>移动到</span>
            </button>
            {showMoveMenu && (
              <div
                className={`absolute right-full top-0 mr-1 w-32 rounded-lg shadow-lg border ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => onMove(fund.id, group.id)}
                    className={`w-full px-4 py-2 text-left text-sm hover:${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => onDelete(fund.id)}
              className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 text-red-500 hover:${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <Trash2 size={14} />
              <span>删除</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

