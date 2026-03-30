import React from 'react'
import { Future, FutureGroup, FutureQuote } from '../../../shared/types'
import { FutureActionMenu } from './FutureActionMenu'
import { getFutureQuote } from '../../utils/futureQuote'

interface FutureListProps {
  darkMode: boolean
  futures: Future[]
  quotes: Record<string, FutureQuote>
  groups: FutureGroup[]
  onDelete: (id: string) => void
  onMove: (futureId: string, groupId: string) => void
  onShowChart?: (symbol: string, name: string) => void
}

export const FutureList: React.FC<FutureListProps> = ({
  darkMode,
  futures,
  quotes,
  groups,
  onDelete,
  onMove,
  onShowChart,
}) => {
  const [showMenuId, setShowMenuId] = React.useState<string | null>(null)

  return (
    <div className={`rounded-lg border ${darkMode ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-white/50'}`}>
      <div className={`grid gap-3 px-4 py-3 text-xs font-semibold ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`} style={{ gridTemplateColumns: '2fr 2fr 1.1fr 1.1fr 1.2fr 1.5fr 1fr' }}>
        <div>合约代码</div>
        <div>合约名称</div>
        <div className="text-right">最新价</div>
        <div className="text-right">涨跌额</div>
        <div className="text-right">涨跌幅</div>
        <div className="text-right">更新时间</div>
        <div className="text-center">操作</div>
      </div>
      <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {futures.map((future) => {
          const quote = getFutureQuote(quotes, future.symbol)
          const currentPrice = quote?.price || 0

          return (
            <div
              key={future.id}
              className={`grid gap-3 px-4 py-3 text-sm cursor-pointer ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50/50'}`}
              style={{ gridTemplateColumns: '2fr 2fr 1.1fr 1.1fr 1.2fr 1.5fr 1fr' }}
              onClick={() => onShowChart?.(future.symbol, future.name)}
            >
              <div className="text-gray-500">{future.symbol}</div>
              <div className="font-medium">{future.name}</div>
              <div className="text-right">{currentPrice ? currentPrice.toFixed(2) : '-'}</div>
              <div className={`text-right ${(quote?.change || 0) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {(quote?.change || 0) >= 0 ? '+' : ''}{(quote?.change || 0).toFixed(2)}
              </div>
              <div className={`text-right ${(quote?.changePercent || 0) >= 0 ? 'text-red-500' : 'text-green-500'}`}>{(quote?.changePercent || 0).toFixed(2)}%</div>
              <div className="text-right text-xs text-gray-500">{quote?.updateTime || '-'}</div>
              <div className="flex justify-center">
                <FutureActionMenu
                  darkMode={darkMode}
                  future={future}
                  groups={groups}
                  isOpen={showMenuId === future.id}
                  onToggle={(event) => {
                    event.stopPropagation()
                    setShowMenuId((prev) => (prev === future.id ? null : future.id))
                  }}
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

