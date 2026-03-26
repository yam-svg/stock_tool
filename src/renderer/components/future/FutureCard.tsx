import React from 'react'
import { Future, FutureGroup, FutureQuote } from '../../../shared/types'
import { FutureActionMenu } from './FutureActionMenu'

interface FutureCardProps {
  darkMode: boolean
  future: Future
  quote?: FutureQuote
  groups: FutureGroup[]
  onDelete: (id: string) => void
  onEdit: (future: Future) => void
  onMove: (futureId: string, groupId: string) => void
}

export const FutureCard: React.FC<FutureCardProps> = ({
  darkMode,
  future,
  quote,
  groups,
  onDelete,
  onEdit,
  onMove,
}) => {
  const [showMenu, setShowMenu] = React.useState(false)
  const currentPrice = quote?.price || 0
  const cost = future.entryPrice * future.quantity
  const marketValue = currentPrice * future.quantity
  const profit = marketValue - cost
  const profitRate = future.entryPrice > 0 ? ((currentPrice - future.entryPrice) / future.entryPrice) * 100 : 0

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
        <div className="text-right">
          <div className={`font-bold ${profit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {currentPrice ? currentPrice.toFixed(2) : '-'}
          </div>
          <div className="text-[11px] text-gray-500">更新时间 {quote?.updateTime || '-'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-gray-500">开仓价</div>
          <div className="font-medium">{future.entryPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">持仓手数</div>
          <div className="font-medium">{future.quantity}</div>
        </div>
        <div>
          <div className="text-gray-500">涨跌幅</div>
          <div className={`font-bold ${(quote?.changePercent || 0) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {(quote?.changePercent || 0).toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-gray-500">市值</div>
          <div className="font-medium">¥{marketValue.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">收益</div>
          <div className={`font-bold ${profit >= 0 ? 'text-red-500' : 'text-green-500'}`}>¥{profit.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">收益率</div>
          <div className={`font-bold ${profitRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>{profitRate.toFixed(2)}%</div>
        </div>
      </div>

      <div className="absolute top-2 right-2">
        <FutureActionMenu
          darkMode={darkMode}
          future={future}
          groups={groups}
          isOpen={showMenu}
          onToggle={() => setShowMenu((v) => !v)}
          onEdit={onEdit}
          onMove={onMove}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

