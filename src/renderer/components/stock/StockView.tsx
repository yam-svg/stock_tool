import React from 'react'
import { LayoutGrid, List, Search } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Stock, StockGroup, StockQuote } from '../../../shared/types'
import { Button } from '../../ui'
import { DraggableStockCard } from './DraggableStockCard'
import { StockList } from './StockList'
import { StockChartModal } from '../modals/StockChartModal'

interface StockViewProps {
  darkMode: boolean
  stockViewMode: 'card' | 'list'
  setStockViewMode: (mode: 'card' | 'list') => void
  totalStockHoldingCount: number
  totalStockMarketValue: number
  visibleStocks: Stock[]
  stockGroups: StockGroup[]
  stockQuotes: Record<string, StockQuote>
  selectedStockGroup: string | null
  onOpenSearchModal: () => void
  onDelete: (id: string) => void
  onEdit: (stock: Stock) => void
  onMove: (stockId: string, groupId: string) => void
  onReorder: (stockIds: string[]) => void
}

export const StockView: React.FC<StockViewProps> = ({
  darkMode,
  stockViewMode,
  setStockViewMode,
  totalStockHoldingCount,
  totalStockMarketValue,
  visibleStocks,
  stockGroups,
  stockQuotes,
  selectedStockGroup,
  onOpenSearchModal,
  onDelete,
  onEdit,
  onMove,
  onReorder,
}) => {
  const [localStocks, setLocalStocks] = React.useState(visibleStocks)
  const totalPositionCount = totalStockHoldingCount
  
  // 走势图模态框状态
  const [showChart, setShowChart] = React.useState(false)
  const [chartSymbol, setChartSymbol] = React.useState('')
  const [chartName, setChartName] = React.useState('')

  // 排序状态
  type SortField = 'symbol' | 'name' | 'quantity' | 'costPrice' | 'currentPrice' | 'change' | 'changePercent' | 'marketValue' | 'profit' | null
  type SortDirection = 'asc' | 'desc'
  const [sortField, setSortField] = React.useState<SortField>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc')
  
  // 打开走势图
  const handleShowChart = (symbol: string, name: string) => {
    setChartSymbol(symbol)
    setChartName(name)
    setShowChart(true)
  }

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 排序函数
  const sortStocks = React.useCallback((stocks: Stock[], field: SortField, direction: SortDirection) => {
    if (!field) return stocks

    return [...stocks].sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (field) {
        case 'symbol':
          aValue = a.symbol
          bValue = b.symbol
          break
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'quantity':
          aValue = a.quantity
          bValue = b.quantity
          break
        case 'costPrice':
          aValue = a.costPrice
          bValue = b.costPrice
          break
        case 'currentPrice':
          aValue = stockQuotes[a.symbol]?.price || 0
          bValue = stockQuotes[b.symbol]?.price || 0
          break
        case 'change':
          aValue = stockQuotes[a.symbol]?.change || 0
          bValue = stockQuotes[b.symbol]?.change || 0
          break
        case 'changePercent':
          aValue = stockQuotes[a.symbol]?.changePercent || 0
          bValue = stockQuotes[b.symbol]?.changePercent || 0
          break
        case 'marketValue':
          aValue = (stockQuotes[a.symbol]?.price || 0) * a.quantity
          bValue = (stockQuotes[b.symbol]?.price || 0) * b.quantity
          break
        case 'profit':
          aValue = ((stockQuotes[a.symbol]?.price || 0) * a.quantity) - (a.costPrice * a.quantity)
          bValue = ((stockQuotes[b.symbol]?.price || 0) * b.quantity) - (b.costPrice * b.quantity)
          break
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue, 'zh-CN')
          : bValue.localeCompare(aValue, 'zh-CN')
      }

      return direction === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })
  }, [stockQuotes])

  // 处理表头点击排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同一字段：切换方向或取消排序
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortField(null)
        setSortDirection('asc')
      }
    } else {
      // 新字段：设置为升序
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 同步外部数据变化并应用排序
  React.useEffect(() => {
    const sorted = sortStocks(visibleStocks, sortField, sortDirection)
    setLocalStocks(sorted)
  }, [visibleStocks, sortField, sortDirection, sortStocks])


  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLocalStocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // 通知父组件保存新顺序
        onReorder(newItems.map((item) => item.id))
        
        return newItems
      })
    }
  }

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

          {totalPositionCount > 0 && (
            <>
              <div
                className={`flex gap-2 items-center px-3 py-1 rounded-md text-sm ${
                  darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="text-xs text-gray-500">持仓个数</div>
                <div className="font-bold text-blue-500">{totalPositionCount}</div>
              </div>
              <div
                className={`flex gap-2 items-center px-3 py-1 rounded-md text-sm ${
                  darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="text-xs text-gray-500">持仓金额(市值)</div>
                <div className="font-bold text-blue-500">¥{totalStockMarketValue.toFixed(2)}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {!(selectedStockGroup && localStocks.length > 0) && (
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
        // 卡片模式：支持拖拽
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localStocks.map((s) => s.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {localStocks.map((stock) => (
                <DraggableStockCard
                  key={stock.id}
                  darkMode={darkMode}
                  stock={stock}
                  quote={stockQuotes[stock.symbol]}
                  groups={stockGroups}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onMove={onMove}
                  onShowChart={handleShowChart}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        // 列表模式：统一使用 StockList 组件
        localStocks.length > 0 && (
          <StockList
            darkMode={darkMode}
            stocks={localStocks}
            quotes={stockQuotes}
            groups={stockGroups}
            onDelete={onDelete}
            onEdit={onEdit}
            onMove={onMove}
            onShowChart={handleShowChart}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            enableDrag={sortField === null}
            onDragEnd={handleDragEnd}
          />
        )
      )}
      
      {/* 走势图模态框 */}
      <StockChartModal
        isOpen={showChart}
        onClose={() => setShowChart(false)}
        symbol={chartSymbol}
        name={chartName}
        darkMode={darkMode}
      />
    </div>
  )
}

