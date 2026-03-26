import React from 'react'
import { Future, FutureGroup, FutureQuote } from '../../../shared/types'
import { FutureActionMenu } from './FutureActionMenu'

interface FutureListProps {
  darkMode: boolean
  futures: Future[]
  quotes: Record<string, FutureQuote>
  groups: FutureGroup[]
  onDelete: (id: string) => void
  onEdit: (future: Future) => void
  onMove: (futureId: string, groupId: string) => void
}

export const FutureList: React.FC<FutureListProps> = ({
  darkMode,
  futures,
  quotes,
  groups,
  onDelete,
  onEdit,
  onMove,
}) => {
  const [showMenuId, setShowMenuId] = React.useState<string | null>(null)

  return (
    <div className={`rounded-lg border ${darkMode ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-white/50'}`}>
      <div className={`grid gap-3 px-4 py-3 text-xs font-semibold ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`} style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1.2fr 1.2fr 1.3fr 1.3fr 1fr' }}>
        <div>合约代码</div>
        <div>合约名称</div>
        <div className="text-right">持仓手数</div>
        <div className="text-right">开仓价</div>
        <div className="text-right">最新价</div>
        <div className="text-right">涨跌幅</div>
        <div className="text-right">市值</div>
        <div className="text-right">收益</div>
        <div className="text-center">操作</div>
      </div>
      <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {futures.map((future) => {
          const quote = quotes[future.symbol]
          const currentPrice = quote?.price || 0
          const marketValue = currentPrice * future.quantity
          const profit = marketValue - future.entryPrice * future.quantity

          return (
            <div key={future.id} className={`grid gap-3 px-4 py-3 text-sm ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'}`} style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1.2fr 1.2fr 1.3fr 1.3fr 1fr' }}>
              <div className="text-gray-500">{future.symbol}</div>
              <div className="font-medium">{future.name}</div>
              <div className="text-right">{future.quantity}</div>
              <div className="text-right">{future.entryPrice.toFixed(2)}</div>
              <div className="text-right">{currentPrice ? currentPrice.toFixed(2) : '-'}</div>
              <div className={`text-right ${(quote?.changePercent || 0) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {(quote?.changePercent || 0).toFixed(2)}%
                <div className="text-xs text-gray-500">{quote?.updateTime || '-'}</div>
              </div>
              <div className="text-right">¥{marketValue.toFixed(2)}</div>
              <div className={`text-right font-bold ${profit >= 0 ? 'text-red-500' : 'text-green-500'}`}>¥{profit.toFixed(2)}</div>
              <div className="flex justify-center">
                <FutureActionMenu
                  darkMode={darkMode}
                  future={future}
                  groups={groups}
                  isOpen={showMenuId === future.id}
                  onToggle={() => setShowMenuId((prev) => (prev === future.id ? null : future.id))}
                  onEdit={onEdit}
                  onMove={onMove}
                  onDelete={onDelete}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

