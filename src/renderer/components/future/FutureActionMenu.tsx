import React from 'react'
import { FolderInput, MoreVertical, Trash2 } from 'lucide-react'
import { Future, FutureGroup } from '../../../shared/types'
import { MoveModal } from '../modals'

interface FutureActionMenuProps {
  darkMode: boolean
  future: Future
  groups: FutureGroup[]
  isOpen: boolean
  onToggle: (e: React.MouseEvent) => void
  onMove: (futureId: string, groupId: string) => void
  onDelete: (id: string) => void
}

export const FutureActionMenu: React.FC<FutureActionMenuProps> = ({
  darkMode,
  future,
  groups,
  isOpen,
  onToggle,
  onMove,
  onDelete,
}) => {
  const [showMoveModal, setShowMoveModal] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isOpen) {
        onToggle(event as any)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }

    return undefined
  }, [isOpen, onToggle])

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isOpen && (
          <div
            className={`absolute right-0 top-full mt-2 w-40 rounded-lg shadow-lg z-50 overflow-hidden border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => {
                setShowMoveModal(true)
                onToggle({} as any)
              }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>移动到</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`确定要删除${future.name}吗？`)) {
                  onDelete(future.id)
                  onToggle({} as any)
                }
              }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 text-red-500 ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除</span>
            </button>
          </div>
        )}
      </div>

      <MoveModal
        darkMode={darkMode}
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMove={(groupId) => {
          onMove(future.id, groupId)
          setShowMoveModal(false)
        }}
        groups={groups}
        currentGroupId={future.groupId}
        title={`移动 ${future.name}`}
      />
    </>
  )
}

