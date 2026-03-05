import { Menu } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { EditModal, FundView, GlobalMarketView, Header, MoveModal, SearchFundModal, SearchStockModal, Sidebar, StockView } from './components'
import { useStore } from './store'
import { useAppLifecycle, useGroupActions, useHoldingActions, usePortfolioMetrics } from './hooks'
import { EditableHolding } from './types/hooks'
import { IconButton } from './ui'

const App: React.FC = () => {
  const {
    activeTab,
    darkMode,
    refreshConfig,
    toggleDarkMode,
    setActiveTab,
    refreshStockQuotes,
    refreshFundQuotes,
    toggleRefresh,
    isMarketOpen,
    nextMarketOpenTime,
    globalIndexes,
    globalRefreshing,
    refreshGlobalIndexes,
    stockGroups,
    fundGroups,
    stocks,
    stockQuotes,
    stockRefreshing,
    fundRefreshing,
    createStockGroup,
    createFundGroup,
    updateStockGroup,
    updateFundGroup,
    deleteStockGroup,
    deleteFundGroup,
    addStock,
    addFund,
    updateStock,
    updateFund,
    deleteStock,
    moveStockToGroup,
    moveFundToGroup,
    selectedStockGroup,
    selectedFundGroup,
    selectStockGroup,
    selectFundGroup,
    funds,
    fundQuotes,
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
  const [addTargetGroupId, setAddTargetGroupId] = useState<string | null>(null)
  const [searchStockModalOpen, setSearchStockModalOpen] = useState(false)
  const [searchFundModalOpen, setSearchFundModalOpen] = useState(false)
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditItem] = useState<EditableHolding | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  useAppLifecycle({
    initialize,
    refreshConfig,
    refreshStockQuotes,
    refreshFundQuotes,
    sidebarCollapsed,
    setSidebarCollapsed,
  })
  
  const {
    stockProfit,
    fundProfit,
    visibleStocks,
    groupCounts,
  } = usePortfolioMetrics({
    activeTab,
    stocks,
    stockQuotes,
    funds,
    fundQuotes,
    selectedStockGroup,
    stockGroups,
    fundGroups,
  })

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
    selectStockGroup,
    selectFundGroup,
    updateStockGroup,
    updateFundGroup,
    deleteStockGroup,
    deleteFundGroup,
    moveStockToGroup,
    moveFundToGroup,
    stocks,
    funds,
    setAddTargetGroupId,
    setSearchStockModalOpen,
    setSearchFundModalOpen,
  })

  const {
    handleDeleteStock,
    handleMoveItem,
    handleMoveModalConfirm,
    handleEditItem,
    handleUpdateItem,
    handleStockSubmit,
    handleFundSubmit,
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
    setSearchStockModalOpen,
    setSearchFundModalOpen,
    setAddTargetGroupId,
    moveStockToGroup,
    moveFundToGroup,
    updateStock,
    updateFund,
    deleteStock,
    addStock,
    addFund,
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

  const handleManualRefresh = () => {
    if (activeTab === 'global') {
      void refreshGlobalIndexes()
      return
    }
    void refreshStockQuotes()
    void refreshFundQuotes()
  }

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
        refreshConfig={refreshConfig}
        stockRefreshing={stockRefreshing}
        fundRefreshing={fundRefreshing}
        globalRefreshing={globalRefreshing}
        isMarketOpen={isMarketOpen}
        nextMarketOpenTime={nextMarketOpenTime}
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

        {activeTab !== 'global' && (
          <Sidebar
            darkMode={darkMode}
            activeTab={activeTab === 'fund' ? 'fund' : 'stock'}
            groups={activeTab === 'stock' ? stockGroups : fundGroups}
            newGroupName={newGroupName}
            onGroupSelect={handleGroupSelect}
            onGroupCreate={handleCreateGroup}
            onGroupNameChange={setNewGroupName}
            stocksCount={groupCounts}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onMoveGroup={handleMoveGroup}
            selectedGroupId={activeTab === 'stock' ? selectedStockGroup : selectedFundGroup}
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
              visibleStocks={visibleStocks}
              stockGroups={stockGroups}
              stockQuotes={stockQuotes}
              selectedStockGroup={selectedStockGroup}
              onOpenSearchModal={() => {
                setAddTargetGroupId(selectedStockGroup || stockGroups[0]?.id || null)
                setSearchStockModalOpen(true)
              }}
              onDelete={handleDeleteStock}
              onEdit={handleEditItem}
              onMove={handleMoveItem}
            />
          ) : activeTab === 'fund' ? (
            <FundView darkMode={darkMode} onEditFund={handleEditItem} />
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
          price: activeTab === 'stock' ? (editingItem?.costPrice ?? 0) : (editingItem?.costNav ?? 0),
          quantity: activeTab === 'stock' ? (editingItem?.quantity ?? 0) : (editingItem?.shares ?? 0),
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
        groups={activeTab === 'stock' ? stockGroups : fundGroups}
        currentGroupId={undefined}
        title={`移动到${activeTab === 'stock' ? '股票' : '基金'}分组`}
      />

      {activeTab === 'stock' && (
        <SearchStockModal
          darkMode={darkMode}
          isOpen={searchStockModalOpen}
          onClose={() => {
            setSearchStockModalOpen(false)
            setAddTargetGroupId(null)
          }}
          group={stockGroups.find(g => g.id === addTargetGroupId)}
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
          group={fundGroups.find(g => g.id === addTargetGroupId)}
          isSubmitting={isAddingFund}
          onSubmit={handleFundSubmit}
        />
      )}
    </div>
  )
}

export default App
