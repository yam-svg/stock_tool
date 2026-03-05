import React from 'react'
import { LayoutGrid, List, Search } from 'lucide-react'
import { Stock, StockGroup, StockQuote } from '../../../shared/types'
import { Button } from '../../ui'
import { StockCard } from './StockCard'
import { StockList } from './StockList'

interface StockViewProps {
  darkMode: boolean
  stockViewMode: 'card' | 'list'
  setStockViewMode: (mode: 'card' | 'list') => void
  visibleStocks: Stock[]
  stockGroups: StockGroup[]
  stockQuotes: Record<string, StockQuote>
  selectedStockGroup: string | null
  onOpenSearchModal: () => void
  onDelete: (id: string) => void
  onEdit: (stock: Stock) => void
  onMove: (stockId: string, groupId: string) => void
}

export const StockView: React.FC<StockViewProps> = ({
  darkMode,
  stockViewMode,
  setStockViewMode,
  visibleStocks,
  stockGroups,
  stockQuotes,
  selectedStockGroup,
  onOpenSearchModal,
  onDelete,
  onEdit,
  onMove,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold">股票持仓</h2>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center rounded-md overflow-hidden border ${
              darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
            }`}
          >
            <button
              onClick={() => setStockViewMode('card')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                stockViewMode === 'card'
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
              title="卡片视图"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>卡片</span>
            </button>
            <button
              onClick={() => setStockViewMode('list')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                stockViewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
              title="列表视图"
            >
              <List className="w-4 h-4" />
              <span>列表</span>
            </button>
          </div>

          {visibleStocks.length > 0 && (
            <div
              className={`flex gap-2 items-center px-3 py-1 rounded-md text-sm ${
                darkMode ? 'bg-gray-800/50' : 'bg-white/50'
              } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="text-xs text-gray-500">持仓数量</div>
              <div className="font-bold text-blue-500">{visibleStocks.length}</div>
            </div>
          )}
        </div>
      </div>

      {!(selectedStockGroup && visibleStocks.length > 0) && (
        <div className="p-4 rounded-xl border">
          <h3 className="text-sm font-semibold mb-4 flex items-center space-x-2">
            <Search className="w-4 h-4 text-blue-500" />
            <span>搜索并添加股票</span>
          </h3>
          <Button
            variant="primary"
            onClick={onOpenSearchModal}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          >
            搜索添加股票
          </Button>
        </div>
      )}

      {stockViewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleStocks.map((stock) => (
            <StockCard
              key={stock.id}
              darkMode={darkMode}
              stock={stock}
              quote={stockQuotes[stock.symbol]}
              groups={stockGroups}
              onDelete={onDelete}
              onEdit={onEdit}
              onMove={onMove}
            />
          ))}
        </div>
      ) : (
        visibleStocks.length > 0 && (
          <StockList
            darkMode={darkMode}
            stocks={visibleStocks}
            quotes={stockQuotes}
            groups={stockGroups}
            onDelete={onDelete}
            onEdit={onEdit}
            onMove={onMove}
          />
        )
      )}
    </div>
  )
}

