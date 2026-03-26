import { Menu } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { EditModal, FundView, FutureView, GlobalMarketView, Header, MoveModal, SearchFundModal, SearchFutureModal, SearchStockModal, Sidebar, StockView } from './components'
import { useStore } from './store'
import { useAppLifecycle, useGroupActions, useHoldingActions, usePortfolioMetrics } from './hooks'
import { EditableHolding } from './types/hooks'
import { IconButton } from './ui'
import { ALL_STOCK_GROUP_ID, isHoldingStockGroup } from '../shared/groupConstants'

const App: React.FC = () => {
  const {
    activeTab,
    darkMode,
    refreshConfig,
    toggleDarkMode,
    setActiveTab,
    refreshStockQuotes,
    refreshFundQuotes,
    refreshFutureQuotes,
    toggleRefresh,
    stockMarketOpen,
    futureMarketOpen,
    stockNextMarketOpenTime,
    futureNextMarketOpenTime,
    globalIndexes,
    globalRefreshing,
    refreshGlobalIndexes,
    stockGroups,
    fundGroups,
    futureGroups,
    stocks,
    stockQuotes,
    stockRefreshing,
    fundRefreshing,
    futureRefreshing,
    createStockGroup,
    createFundGroup,
    createFutureGroup,
    updateStockGroup,
    updateFundGroup,
    updateFutureGroup,
    deleteStockGroup,
    deleteFundGroup,
    deleteFutureGroup,
    addStock,
    addFund,
    addFuture,
    updateStock,
    updateFund,
    deleteStock,
    deleteFund,
    deleteFuture,
    moveStockToGroup,
    moveFundToGroup,
    moveFutureToGroup,
    reorderStocks,
    selectedStockGroup,
    selectedFundGroup,
    selectedFutureGroup,
    selectStockGroup,
    selectFundGroup,
    selectFutureGroup,
    funds,
    fundQuotes,
    futures,
    futureQuotes,
    stockViewMode,
    globalViewMode,
    setStockViewMode,
    setGlobalViewMode,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    initialize,
  } = useStore()

  const [newGroupName, setNewGroupName] = useState('')
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [moveItemId, setMoveItemId] = useState<string | null>(null)
  const [isAddingStock, setIsAddingStock] = useState(false)
  const [isAddingFund, setIsAddingFund] = useState(false)
  const [isAddingFuture, setIsAddingFuture] = useState(false)
  const [addTargetGroupId, setAddTargetGroupId] = useState<string | null>(null)
  const [searchStockModalOpen, setSearchStockModalOpen] = useState(false)
  const [searchFundModalOpen, setSearchFundModalOpen] = useState(false)
  const [searchFutureModalOpen, setSearchFutureModalOpen] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditItem] = useState<EditableHolding | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useAppLifecycle({
    initialize,
    refreshConfig,
    refreshStockQuotes,
    refreshFundQuotes,
    refreshFutureQuotes,
    setSidebarCollapsed,
  })

  const {
    stockProfit,
    fundProfit,
    futureProfit,
    visibleStocks,
    groupCounts,
  } = usePortfolioMetrics({
    activeTab,
    stocks,
    stockQuotes,
    funds,
    fundQuotes,
    futures,
    futureQuotes,
    selectedStockGroup,
    stockGroups,
    fundGroups,
    futureGroups,
  })

  const totalStockHoldingCount = useMemo(
    () => stocks.filter((s) => (s.quantity || 0) > 0).length,
    [stocks],
  )

  const totalStockMarketValue = useMemo(
    () =>
      stocks.reduce((sum, stock) => {
        const quantity = stock.quantity || 0
        if (quantity <= 0) return sum
        const currentPrice = stockQuotes[stock.symbol]?.price || 0
        return sum + currentPrice * quantity
      }, 0),
    [stocks, stockQuotes],
  )

  const {
    handleCreateGroup,
    handleGroupSelect,
    handleUpdateGroup,
    handleDeleteGroup,
    handleMoveGroup,
    handleAddToGroup,
  } = useGroupActions({
    activeTab,
    newGroupName,
    setNewGroupName,
    createStockGroup,
    createFundGroup,
    createFutureGroup,
    selectStockGroup,
    selectFundGroup,
    selectFutureGroup,
    updateStockGroup,
    updateFundGroup,
    updateFutureGroup,
    deleteStockGroup,
    deleteFundGroup,
    deleteFutureGroup,
    moveStockToGroup,
    moveFundToGroup,
    moveFutureToGroup,
    stocks,
    funds,
    futures,
    setAddTargetGroupId,
    setSearchStockModalOpen,
    setSearchFundModalOpen,
    setSearchFutureModalOpen,
  })

  const {
    handleDeleteStock,
    handleMoveItem,
    handleMoveModalConfirm,
    handleEditItem,
    handleUpdateItem,
    handleStockSubmit,
    handleFundSubmit,
    handleFutureSubmit,
  } = useHoldingActions({
    activeTab,
    editingItem,
    moveItemId,
    setMoveModalOpen,
    setMoveItemId,
    setEditModalOpen,
    setEditItem,
    setIsUpdating,
    setIsAddingStock,
    setIsAddingFund,
    setIsAddingFuture,
    setSearchStockModalOpen,
    setSearchFundModalOpen,
    setSearchFutureModalOpen,
    setAddTargetGroupId,
    moveStockToGroup,
    moveFundToGroup,
    moveFutureToGroup,
    updateStock,
    updateFund,
    deleteStock,
    deleteFund,
    deleteFuture,
    addStock,
    addFund,
    addFuture,
  })

  // 仅在存在开市市场时自动刷新全球指数
  useEffect(() => {
    if (activeTab !== 'global') return
    const hasOpenMarket = globalIndexes.some((item) => item.isOpen)
    if (!hasOpenMarket) return

    const timer = setInterval(() => {
      void refreshGlobalIndexes()
    }, 15000)

    return () => clearInterval(timer)
  }, [activeTab, globalIndexes, refreshGlobalIndexes])

  // 切换到期货页时立即拉取一次最新行情，避免首屏看到旧数据。
  useEffect(() => {
    if (activeTab !== 'future') return
    void refreshFutureQuotes()
  }, [activeTab, refreshFutureQuotes])

  const handleManualRefresh = () => {
    if (activeTab === 'global') {
      void refreshGlobalIndexes()
      return
    }
    void refreshStockQuotes()
    void refreshFundQuotes()
    void refreshFutureQuotes()
  }

  const currentTabMarketOpen = activeTab === 'future' ? futureMarketOpen : stockMarketOpen
  const currentTabNextOpenTime = activeTab === 'future' ? futureNextMarketOpenTime : stockNextMarketOpenTime

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100'
          : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-800'
      }`}
    >
      <Header
        darkMode={darkMode}
        activeTab={activeTab}
        stockProfit={stockProfit}
        fundProfit={fundProfit}
        futureProfit={futureProfit}
        refreshConfig={refreshConfig}
        stockRefreshing={stockRefreshing}
        fundRefreshing={fundRefreshing}
        futureRefreshing={futureRefreshing}
        globalRefreshing={globalRefreshing}
        isMarketOpen={currentTabMarketOpen}
        nextMarketOpenTime={currentTabNextOpenTime}
        setActiveTab={setActiveTab}
        toggleDarkMode={toggleDarkMode}
        toggleRefresh={toggleRefresh}
        onManualRefresh={handleManualRefresh}
      />

      <div className="flex relative w-full">
        {activeTab !== 'global' && sidebarCollapsed && (
          <IconButton
            onClick={toggleSidebar}
            darkMode={darkMode}
            icon={<Menu className="w-2 h-2" />}
            tooltip="展开侧边栏"
            className="fixed left-0 top-[52px] z-50 rounded-r-lg rounded-l-none shadow-lg pointer-events-auto"
            size="sm"
          />
        )}

        {activeTab !== 'global' && !sidebarCollapsed && (
          <button
            type="button"
            aria-label="关闭分组侧栏"
            onClick={toggleSidebar}
            className="fixed inset-0 top-16 z-30 bg-black/30 lg:hidden"
          />
        )}

        {activeTab !== 'global' && (
          <Sidebar
            darkMode={darkMode}
            activeTab={activeTab === 'stock' ? 'stock' : activeTab === 'fund' ? 'fund' : 'future'}
            groups={activeTab === 'stock' ? stockGroups : activeTab === 'fund' ? fundGroups : futureGroups}
            newGroupName={newGroupName}
            onGroupSelect={handleGroupSelect}
            onGroupCreate={handleCreateGroup}
            onGroupNameChange={setNewGroupName}
            stocksCount={groupCounts}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onMoveGroup={handleMoveGroup}
            selectedGroupId={
              activeTab === 'stock'
                ? selectedStockGroup
                : activeTab === 'fund'
                ? selectedFundGroup
                : selectedFutureGroup
            }
            onAddToGroup={handleAddToGroup}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        )}

        <div className="flex-1 p-4 overflow-auto w-full">
          {activeTab === 'stock' ? (
            <StockView
              darkMode={darkMode}
              stockViewMode={stockViewMode}
              setStockViewMode={setStockViewMode}
              totalStockHoldingCount={totalStockHoldingCount}
              totalStockMarketValue={totalStockMarketValue}
              visibleStocks={visibleStocks}
              stockGroups={stockGroups}
              stockQuotes={stockQuotes}
              selectedStockGroup={selectedStockGroup}
              onOpenSearchModal={() => {
                const targetGroupId = isHoldingStockGroup(selectedStockGroup)
                  ? stockGroups.find((g) => g.id === ALL_STOCK_GROUP_ID)?.id || null
                  : selectedStockGroup || stockGroups[0]?.id || null
                setAddTargetGroupId(targetGroupId)
                setSearchStockModalOpen(true)
              }}
              onDelete={handleDeleteStock}
              onEdit={handleEditItem}
              onMove={handleMoveItem}
              onReorder={reorderStocks}
            />
          ) : activeTab === 'fund' ? (
            <FundView darkMode={darkMode} onEditFund={handleEditItem} />
          ) : activeTab === 'future' ? (
            <FutureView darkMode={darkMode} />
          ) : (
            <GlobalMarketView
              darkMode={darkMode}
              indexes={globalIndexes}
              viewMode={globalViewMode}
              setViewMode={setGlobalViewMode}
            />
          )}
        </div>
      </div>

      <EditModal
        darkMode={darkMode}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditItem(null)
        }}
        title={`编辑${activeTab === 'stock' ? '股票' : '基金'}`}
        initialData={{
          name: editingItem?.name || '',
          price:
            activeTab === 'stock'
              ? (editingItem?.costPrice ?? 0)
              : activeTab === 'fund'
              ? (editingItem?.costNav ?? 0)
              : 0,
          quantity:
            activeTab === 'stock'
              ? (editingItem?.quantity ?? 0)
              : activeTab === 'fund'
              ? (editingItem?.shares ?? 0)
              : 0,
        }}
        onSubmit={handleUpdateItem}
        isSubmitting={isUpdating}
      />

      <MoveModal
        darkMode={darkMode}
        isOpen={moveModalOpen}
        onClose={() => {
          setMoveModalOpen(false)
          setMoveItemId(null)
        }}
        onMove={handleMoveModalConfirm}
        groups={activeTab === 'stock' ? stockGroups : activeTab === 'fund' ? fundGroups : futureGroups}
        currentGroupId={undefined}
        title={`移动到${activeTab === 'stock' ? '股票' : activeTab === 'fund' ? '基金' : '期货'}分组`}
      />

      {activeTab === 'stock' && (
        <SearchStockModal
          darkMode={darkMode}
          isOpen={searchStockModalOpen}
          onClose={() => {
            setSearchStockModalOpen(false)
            setAddTargetGroupId(null)
          }}
          group={stockGroups.find((g) => g.id === addTargetGroupId)}
          isSubmitting={isAddingStock}
          onSubmit={handleStockSubmit}
        />
      )}

      {activeTab === 'fund' && (
        <SearchFundModal
          darkMode={darkMode}
          isOpen={searchFundModalOpen}
          onClose={() => {
            setSearchFundModalOpen(false)
            setAddTargetGroupId(null)
          }}
          group={fundGroups.find((g) => g.id === addTargetGroupId)}
          isSubmitting={isAddingFund}
          onSubmit={handleFundSubmit}
        />
      )}

      {activeTab === 'future' && (
        <SearchFutureModal
          darkMode={darkMode}
          isOpen={searchFutureModalOpen}
          onClose={() => {
            setSearchFutureModalOpen(false)
            setAddTargetGroupId(null)
          }}
          group={futureGroups.find((g) => g.id === addTargetGroupId)}
          isSubmitting={isAddingFuture}
          onSubmit={handleFutureSubmit}
        />
      )}
    </div>
  )
}

export default App
