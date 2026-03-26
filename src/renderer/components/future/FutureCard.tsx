import React from 'react'
import { Future, FutureGroup, FutureQuote } from '../../../shared/types'
import { FutureActionMenu } from './FutureActionMenu'

interface FutureCardProps {
  darkMode: boolean
  future: Future
  quote?: FutureQuote
  groups: FutureGroup[]
  onDelete: (id: string) => void
  onMove: (futureId: string, groupId: string) => void
}

export const FutureCard: React.FC<FutureCardProps> = ({
  darkMode,
  future,
  quote,
  groups,
  onDelete,
  onMove,
}) => {
  const [showMenu, setShowMenu] = React.useState(false)
  const currentPrice = quote?.price || 0
  const changePercent = quote?.changePercent || 0

  return (
    <div
      className={`rounded-lg p-3 relative border backdrop-blur-sm ${
        darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-sm">{future.name}</h3>
          <p className="text-xs text-gray-500">{future.symbol}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-right">
            <div className={`font-bold ${changePercent >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {currentPrice ? currentPrice.toFixed(2) : '-'}
            </div>
            <div className="text-[11px] text-gray-500">更新时间 {quote?.updateTime || '-'}</div>
          </div>
          <FutureActionMenu
            darkMode={darkMode}
            future={future}
            groups={groups}
            isOpen={showMenu}
            onToggle={() => setShowMenu((v) => !v)}
            onMove={onMove}
            onDelete={onDelete}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-gray-500">涨跌额</div>
          <div className={`font-medium ${(quote?.change || 0) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {(quote?.change || 0).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-gray-500">涨跌幅</div>
          <div className={`font-bold ${changePercent >= 0 ? 'text-red-500' : 'text-green-500'}`}>{changePercent.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  )
}

