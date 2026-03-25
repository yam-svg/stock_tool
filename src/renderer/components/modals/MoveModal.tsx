import React from 'react'
import { createPortal } from 'react-dom'
import { X, FolderInput } from 'lucide-react'
import { Button, IconButton } from '../../ui'
import { isSystemFundGroup, isSystemStockGroup } from '../../../shared/groupConstants'

interface Group {
  id: string
  name: string
}

interface MoveModalProps {
  darkMode: boolean
  isOpen: boolean
  onClose: () => void
  onMove: (groupId: string) => void
  groups: Group[]
  currentGroupId?: string
  title: string
}

export const MoveModal: React.FC<MoveModalProps> = ({
  darkMode,
  isOpen,
  onClose,
  onMove,
  groups,
  currentGroupId,
  title
}) => {
  if (!isOpen) return null

  if (typeof document === 'undefined') return null

  const movableGroups = groups.filter(
    (g) => g.id !== currentGroupId && !isSystemStockGroup(g.id) && !isSystemFundGroup(g.id),
  )

  return createPortal(
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
      
      {/* 模态框 */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl z-50 ${
        darkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <FolderInput className="w-5 h-5 text-blue-500" />
            <span>{title}</span>
          </h3>
          <IconButton
            onClick={onClose}
            darkMode={darkMode}
            variant="ghost"
            icon={<X />}
            size="sm"
            tooltip="关闭"
          />
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              选择目标分组
            </label>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {movableGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => {
                    onMove(group.id)
                    onClose()
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    darkMode 
                      ? 'bg-gray-700/50 hover:bg-gray-700 border border-gray-600/30' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      darkMode ? 'bg-blue-400' : 'bg-blue-500'
                    }`}></div>
                    <span className={`font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{group.name}</span>
                  </div>
                </button>
              ))}
              
              {movableGroups.length === 0 && (
                <div className={`text-center py-8 text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  没有其他分组可用
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className={`px-6 py-4 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            取消
          </Button>
        </div>
      </div>
    </>
    ,
    document.body
  )
}
