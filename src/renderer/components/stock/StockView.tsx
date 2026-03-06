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
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Stock, StockGroup, StockQuote } from '../../../shared/types'
import { Button } from '../../ui'
import { DraggableStockCard } from './DraggableStockCard'
import { DraggableStockRow } from './DraggableStockRow'

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
  onReorder: (stockIds: string[]) => void
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
  onReorder,
}) => {
  const [localStocks, setLocalStocks] = React.useState(visibleStocks)
  const [showMenuId, setShowMenuId] = React.useState<string | null>(null)
  const [flashColors, setFlashColors] = React.useState<Record<string, 'red' | 'green'>>({})
  const prevPricesRef = React.useRef<Record<string, number>>({})

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动 8px 才开始拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 同步外部数据变化
  React.useEffect(() => {
    setLocalStocks(visibleStocks)
  }, [visibleStocks])

  // 价格更新闪烁效果（仅列表模式）
  React.useEffect(() => {
    if (stockViewMode !== 'list') return
    
    const newFlashColors: Record<string, 'red' | 'green'> = {}
    localStocks.forEach((stock) => {
      const currentPrice = stockQuotes[stock.symbol]?.price || 0
      const prevPrice = prevPricesRef.current[stock.symbol] || currentPrice
      if (currentPrice !== prevPrice && prevPrice !== 0) {
        if (currentPrice > prevPrice) {
          newFlashColors[stock.id] = 'red'
        } else if (currentPrice < prevPrice) {
          newFlashColors[stock.id] = 'green'
        }
      }
      prevPricesRef.current[stock.symbol] = currentPrice
    })
    if (Object.keys(newFlashColors).length > 0) {
      setFlashColors(newFlashColors)
      const timer = setTimeout(() => {
        setFlashColors({})
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [localStocks, stockQuotes, stockViewMode])

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

          {localStocks.length > 0 && (
            <div
              className={`flex gap-2 items-center px-3 py-1 rounded-md text-sm ${
                darkMode ? 'bg-gray-800/50' : 'bg-white/50'
              } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="text-xs text-gray-500">持仓数量</div>
              <div className="font-bold text-blue-500">{localStocks.length}</div>
            </div>
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

      {/* 拖拽上下文 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localStocks.map((s) => s.id)}
          strategy={stockViewMode === 'card' ? rectSortingStrategy : verticalListSortingStrategy}
        >
          {stockViewMode === 'card' ? (
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
                />
              ))}
            </div>
          ) : (
            localStocks.length > 0 && (
              <div
                className={`rounded-lg border ${
                  darkMode ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-white/50'
                } backdrop-blur-sm`}
              >
                {/* 表头 */}
                <div
                  className={`grid gap-4 px-4 py-3 text-xs font-semibold ${
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                  }`}
                  style={{
                    gridTemplateColumns: '40px 1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1.2fr 1.2fr 0.6fr',
                  }}
                >
                  <div></div>
                  <div>股票代码</div>
                  <div>股票名称</div>
                  <div className="text-right">持仓数量</div>
                  <div className="text-right">成本价</div>
                  <div className="text-right">当前价</div>
                  <div className="text-right">涨跌额</div>
                  <div className="text-right">涨跌幅</div>
                  <div className="text-right">市值</div>
                  <div className="text-right">收益</div>
                  <div className="text-center">操作</div>
                </div>
                {/* 表格内容 */}
                <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {localStocks.map((stock) => (
                    <DraggableStockRow
                      key={stock.id}
                      darkMode={darkMode}
                      stock={stock}
                      quote={stockQuotes[stock.symbol]}
                      groups={stockGroups}
                      showMenu={showMenuId === stock.id}
                      flashColor={flashColors[stock.id] || null}
                      onToggleMenu={(e) => {
                        e.stopPropagation?.()
                        setShowMenuId(showMenuId === stock.id ? null : stock.id)
                      }}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onMove={onMove}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </SortableContext>
      </DndContext>
    </div>
  )
}

