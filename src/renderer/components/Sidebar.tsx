import React from 'react'
import { FolderPlus, Plus } from 'lucide-react'
import { GroupItem } from './GroupItem'

interface Group {
  id: string
  name: string
}

interface SidebarProps {
  darkMode: boolean
  activeTab: 'stock' | 'fund'
  groups: Group[]
  newGroupName: string
  onGroupSelect: (groupId: string) => void
  onGroupCreate: () => void
  onGroupNameChange: (name: string) => void
  stocksCount?: Record<string, number>
  onUpdateGroup?: (id: string, newName: string) => void
  onDeleteGroup?: (id: string) => void
  onMoveGroup?: (groupId: string, targetGroupId: string) => void
  selectedGroupId?: string | null
  onAddToGroup?: (groupId: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  darkMode,
  activeTab,
  groups,
  newGroupName,
  onGroupSelect,
  onGroupCreate,
  onGroupNameChange,
  stocksCount,
  onUpdateGroup,
  onDeleteGroup,
  onMoveGroup,
  selectedGroupId,
  onAddToGroup
}) => {
  return (
    <div className={`w-64 ${
      darkMode 
        ? 'bg-gray-800/50 border-gray-700/50' 
        : 'bg-white/50 border-gray-200/50'
    } border-r backdrop-blur-sm`}>
      <div className="sticky top-16 h-[calc(100vh-4rem)] flex flex-col p-4">
        {/* 标题 */}
        <div className="flex items-center space-x-2 mb-4">
          <FolderPlus className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-semibold">分组管理</h2>
        </div>
        
        {/* 创建分组输入框 */}
        <div className="space-y-2 mb-4 flex-shrink-0">
          <div className={`relative rounded-md overflow-hidden ${
            darkMode ? 'bg-gray-700/50' : 'bg-white/50'
          } border ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onGroupCreate()}
              placeholder={`新建${activeTab === 'stock' ? '股票' : '基金'}分组`}
              className={`w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-transparent text-white placeholder-gray-400' 
                  : 'bg-transparent text-gray-800 placeholder-gray-500'
              }`}
            />
          </div>
          <button
            onClick={onGroupCreate}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 text-sm rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-1 shadow hover:shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>创建分组</span>
          </button>
        </div>

        {/* 分组列表 */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="text-xs font-medium text-gray-500 px-2 mb-2 flex-shrink-0">我的分组</div>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {groups.map(group => (
              <GroupItem
                key={group.id}
                darkMode={darkMode}
                group={group}
                isSelected={selectedGroupId === group.id}
                itemCount={stocksCount?.[group.id] || 0}
                onSelect={() => onGroupSelect(group.id)}
                onEdit={(newName) => onUpdateGroup?.(group.id, newName)}
                onDelete={() => onDeleteGroup?.(group.id)}
                onMove={(targetId) => onMoveGroup?.(group.id, targetId)}
                groups={groups}
                onAdd={() => onAddToGroup?.(group.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
