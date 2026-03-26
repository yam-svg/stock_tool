import { ChevronLeft, FolderPlus, Plus } from 'lucide-react'
import React from 'react'
import { GroupItem } from '../group'
import {
  isHoldingFutureGroup,
  isHoldingFundGroup,
  isHoldingStockGroup,
  isSystemFutureGroup,
  isSystemFundGroup,
  isSystemStockGroup,
} from '../../../shared/groupConstants'

interface Group {
  id: string
  name: string
}

interface SidebarProps {
  darkMode: boolean
  activeTab: 'stock' | 'fund' | 'future'
  groups: Group[]
  newGroupName: string
  collapsed: boolean
  onToggleCollapse?: () => void
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
  collapsed,
  onToggleCollapse,
  onGroupSelect,
  onGroupCreate,
  onGroupNameChange,
  stocksCount,
  onUpdateGroup,
  onDeleteGroup,
  onMoveGroup,
  selectedGroupId,
  onAddToGroup,
}) => {
  return (
    <div className={`${collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-64'} transition-all duration-300 shrink-0 fixed left-0 top-16 z-40 shadow-xl lg:shadow-none lg:relative lg:top-0 ${
      darkMode
        ? 'bg-gray-800/50 border-gray-700/50'
        : 'bg-white/50 border-gray-200/50'
    } border-r backdrop-blur-sm`}>
      <div className="w-64 h-[calc(100vh-4rem)] flex flex-col p-4 lg:sticky lg:top-16">
        {/* 头部：标题和收起按钮 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold">分组管理</h2>
          </div>
          {!collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`p-1 rounded transition-colors ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              title="收起侧边栏"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
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
              onKeyDown={(e) => e.key === 'Enter' && onGroupCreate()}
              placeholder={`新建${activeTab === 'stock' ? '股票' : activeTab === 'fund' ? '基金' : '期货'}分组`}
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
                isSystemGroup={
                  activeTab === 'stock'
                    ? isSystemStockGroup(group.id)
                    : activeTab === 'fund'
                      ? isSystemFundGroup(group.id)
                      : isSystemFutureGroup(group.id)
                }
                isSelected={selectedGroupId === group.id}
                itemCount={stocksCount?.[group.id] || 0}
                onSelect={() => onGroupSelect(group.id)}
                onEdit={(newName) => onUpdateGroup?.(group.id, newName)}
                onDelete={() => onDeleteGroup?.(group.id)}
                onMove={(targetId) => onMoveGroup?.(group.id, targetId)}
                groups={groups.filter((g) =>
                  activeTab === 'stock'
                    ? !isSystemStockGroup(g.id)
                    : activeTab === 'fund'
                      ? !isSystemFundGroup(g.id)
                      : !isSystemFutureGroup(g.id)
                )}
                onAdd={
                  !(
                    activeTab === 'stock'
                      ? isHoldingStockGroup(group.id)
                      : activeTab === 'fund'
                        ? isHoldingFundGroup(group.id)
                        : isHoldingFutureGroup(group.id)
                  )
                    ? () => onAddToGroup?.(group.id)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

