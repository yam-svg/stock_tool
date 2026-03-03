import React, { useState } from 'react'
import { MoreVertical, Edit2, Trash2, FolderInput, Plus } from 'lucide-react'

interface Group {
  id: string
  name: string
}

interface GroupItemProps {
  darkMode: boolean
  group: Group
  isSelected: boolean
  itemCount: number
  onSelect: () => void
  onEdit: (newName: string) => void
  onDelete: () => void
  onMove?: (targetGroupId: string) => void
  groups?: Group[]
  onAdd?: () => void
}

export const GroupItem: React.FC<GroupItemProps> = ({
  darkMode,
  group,
  isSelected,
  itemCount,
  onSelect,
  onEdit,
  onDelete,
  onMove,
  groups,
  onAdd
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

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

  // 处理键盘快捷键
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showMenu) return
      
      // 如果正在编辑，不处理快捷键
      if (isEditing) return
      
      // 按 D 键删除
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        onDelete()
        setShowMenu(false)
      }
      
      // 按 E 键编辑
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setIsEditing(true)
        setShowMenu(false)
      }
      
      // 按 M 键移动（如果有分组）
      if ((e.key === 'm' || e.key === 'M') && onMove && groups && groups.length > 1) {
        e.preventDefault()
        setShowMoveMenu(true)
      }
      
      // ESC 键关闭菜单
      if (e.key === 'Escape') {
        setShowMenu(false)
        setShowMoveMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showMenu, isEditing, onDelete, onMove, groups])

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onEdit(editName.trim())
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditName(group.name)
    setIsEditing(false)
  }

  return (
    <div 
      className="relative"
    >
      <div 
        className={`p-2 rounded-md transition-all duration-200 cursor-pointer group ${
          isSelected
            ? darkMode
              ? 'bg-blue-500/30 border-blue-500/50 text-blue-300 shadow-md'
              : 'bg-blue-500/20 border-blue-500/30 text-blue-700 shadow-md'
            : darkMode
              ? 'bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30'
              : 'bg-white/30 hover:bg-white/70 border border-gray-200/30'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              darkMode ? 'bg-blue-400' : 'bg-blue-500'
            }`}></div>
            
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                onKeyDown={(e) => e.key === 'Escape' && handleCancelEdit()}
                className={`flex-1 text-sm font-medium bg-transparent border-b focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'border-gray-600' : 'border-gray-300'
                }`}
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium truncate">{group.name}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              darkMode ? 'bg-black/10 text-gray-400' : 'bg-white/50 text-gray-600'
            }`}>
              {itemCount}
            </span>
            {onAdd && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                  darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                }`}
                title="添加"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                  if (showMenu) setShowMoveMenu(false)
                }}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                  darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                }`}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* 操作菜单 - 点击显示 */}
              {showMenu && (
                <div 
                  className={`absolute right-0 top-full mt-1 w-32 rounded-lg shadow-lg z-20 overflow-hidden border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>编辑</span>
                    </div>
                    <kbd className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-400' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      E
                    </kbd>
                  </button>
                  
                  {onMove && groups && groups.length > 1 && (
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowMoveMenu(!showMoveMenu)
                        }}
                        className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <FolderInput className="w-3.5 h-3.5" />
                          <span>移动到</span>
                        </div>
                        <kbd className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-400' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          M
                        </kbd>
                      </button>
                      
                      {showMoveMenu && (
                        <div className={`ml-32 -mt-8 w-32 rounded-lg shadow-lg z-20 overflow-hidden border absolute left-full top-0 ${
                          darkMode 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                        }`}>
                          {groups.filter(g => g.id !== group.id).map(g => (
                            <button
                              key={g.id}
                              onClick={() => {
                                onMove(g.id)
                                setShowMoveMenu(false)
                                setShowMenu(false)
                              }}
                              className={`w-full px-3 py-2 text-sm text-left ${
                                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                            >
                              {g.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      onDelete()
                      setShowMenu(false)
                    }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>删除</span>
                    </div>
                    <kbd className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-400' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      D
                    </kbd>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
