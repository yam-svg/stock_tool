import React from 'react'
import { CandlestickChart, LayoutGrid, List } from 'lucide-react'
import { useFutureStore, useUIStore } from '../../store'
import { FutureCard } from './FutureCard'
import { FutureList } from './FutureList'
import { isAllFutureGroup, isHoldingFutureGroup } from '../../../shared/groupConstants'

interface FutureViewProps {
  darkMode: boolean
  onEditFuture: (future: any) => void
}

export const FutureView: React.FC<FutureViewProps> = ({ darkMode, onEditFuture }) => {
  const futures = useFutureStore((state) => state.futures)
  const futureQuotes = useFutureStore((state) => state.futureQuotes)
  const futureGroups = useFutureStore((state) => state.futureGroups)
  const selectedFutureGroup = useFutureStore((state) => state.selectedFutureGroup)
  const deleteFuture = useFutureStore((state) => state.deleteFuture)
  const moveFutureToGroup = useFutureStore((state) => state.moveFutureToGroup)

  const futureViewMode = useUIStore((state) => state.futureViewMode)
  const setFutureViewMode = useUIStore((state) => state.setFutureViewMode)

  const filteredFutures = React.useMemo(() => {
    if (!selectedFutureGroup) return []
    if (isAllFutureGroup(selectedFutureGroup)) return futures
    if (isHoldingFutureGroup(selectedFutureGroup)) return futures.filter((f) => (f.quantity || 0) > 0)
    return futures.filter((f) => f.groupId === selectedFutureGroup)
  }, [futures, selectedFutureGroup])

  const totalPositionCount = React.useMemo(() => futures.filter((f) => (f.quantity || 0) > 0).length, [futures])
  const totalMarketValue = React.useMemo(
    () =>
      futures.reduce((sum, future) => {
        if ((future.quantity || 0) <= 0) return sum
        return sum + (futureQuotes[future.symbol]?.price || 0) * future.quantity
      }, 0),
    [futures, futureQuotes],
  )

  if (futures.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className={`inline-flex p-4 rounded-full mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
            <CandlestickChart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">暂无期货持仓</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>请先在左侧创建并选择期货分组，然后通过“搜索并添加期货”功能添加合约。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">期货持仓</h2>
        <div className="flex items-center gap-3">
          <div className={`flex items-center rounded-md overflow-hidden border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'}`}>
            <button
              onClick={() => setFutureViewMode('card')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                futureViewMode === 'card'
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>卡片</span>
            </button>
            <button
              onClick={() => setFutureViewMode('list')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                futureViewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>列表</span>
            </button>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} border ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="text-xs text-gray-500">持仓个数</div>
            <div className="font-bold text-blue-500">{totalPositionCount}</div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} border ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="text-xs text-gray-500">持仓金额(市值)</div>
            <div className="font-bold text-blue-500">¥{totalMarketValue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {futureViewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredFutures.map((future) => (
            <FutureCard
              key={future.id}
              darkMode={darkMode}
              future={future}
              quote={futureQuotes[future.symbol]}
              groups={futureGroups}
              onDelete={deleteFuture}
              onEdit={onEditFuture}
              onMove={moveFutureToGroup}
            />
          ))}
        </div>
      ) : (
        <FutureList
          darkMode={darkMode}
          futures={filteredFutures}
          quotes={futureQuotes}
          groups={futureGroups}
          onDelete={deleteFuture}
          onEdit={onEditFuture}
          onMove={moveFutureToGroup}
        />
      )}
    </div>
  )
}

