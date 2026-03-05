import { Menu } from 'lucide-react'
import React, { useState } from 'react'
import { EditModal, FundView, Header, MoveModal, SearchFundModal, SearchStockModal, Sidebar, StockView } from './components'
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
    setStockViewMode,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    initialize,
  } = useStore()
  
  // 页面本地 UI 状态：分组输入、弹窗开关、编辑上下文
  const [newGroupName, setNewGroupName] = useState('')
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [moveItemId, setMoveItemId] = useState<string | null>(null)
  const [isAddingStock, setIsAddingStock] = useState(false)
  const [isAddingFund, setIsAddingFund] = useState(false)
  const [addTargetGroupId, setAddTargetGroupId] = useState<string | null>(null)
  const [searchStockModalOpen, setSearchStockModalOpen] = useState(false)
  const [searchFundModalOpen, setSearchFundModalOpen] = useState(false)
  
  // 编辑状态
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditItem] = useState<EditableHolding | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // 应用生命周期管理
  useAppLifecycle({
    initialize,
    refreshConfig,
    refreshStockQuotes,
    refreshFundQuotes,
    sidebarCollapsed,
    setSidebarCollapsed,
  })
  
  // 纯计算数据：收益汇总、当前分组可见股票、分组数量
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

  // 分组相关操作（创建/选择/更新/删除/批量移动）
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

  // 持仓相关操作（编辑/移动/删除/新增股票/新增基金）
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

  // 手动刷新只负责触发，不在这里处理定时逻辑
  const handleManualRefresh = () => {
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
      {/* Header 导航栏 */}
      <Header
        darkMode={darkMode}
        activeTab={activeTab}
        stockProfit={stockProfit}
        fundProfit={fundProfit}
        refreshConfig={refreshConfig}
        stockRefreshing={stockRefreshing}
        fundRefreshing={fundRefreshing}
        setActiveTab={setActiveTab}
        toggleDarkMode={toggleDarkMode}
        toggleRefresh={toggleRefresh}
        onManualRefresh={handleManualRefresh}
      />
      
      {/* 主内容区域 */}
      <div className="flex relative w-full">
        {/* 侧边栏切换按钮 - 展开按钮 */}
        {sidebarCollapsed && (
          <IconButton
            onClick={toggleSidebar}
            darkMode={darkMode}
            icon={<Menu />}
            tooltip="展开侧边栏"
            className="fixed left-0 top-12 z-50 rounded-r-lg rounded-l-none shadow-lg pointer-events-auto"
            size="sm"
          />
        )}

        {/* Sidebar 分组管理 */}
        <Sidebar
          darkMode={darkMode}
          activeTab={activeTab}
          groups={activeTab === 'stock' ? stockGroups : fundGroups}
          newGroupName={newGroupName}
          onGroupSelect={handleGroupSelect}
          onGroupCreate={handleCreateGroup}
          onGroupNameChange={setNewGroupName}
          stocksCount={groupCounts}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
          onMoveGroup={handleMoveGroup}
          selectedGroupId={
            activeTab === 'stock' ? selectedStockGroup : selectedFundGroup
          }
          onAddToGroup={handleAddToGroup}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
        
        {/*右内容区域 */}
        <div className="flex-1 p-4 overflow-auto w-full">
          <div className="w-full">
            {activeTab === 'stock' ? (
              <StockView
                darkMode={darkMode}
                stockViewMode={stockViewMode}
                setStockViewMode={setStockViewMode}
                visibleStocks={visibleStocks}
                stockGroups={stockGroups}
                stockQuotes={stockQuotes}
                selectedStockGroup={selectedStockGroup}
                // 从主视图快速添加股票时，优先使用当前选中分组
                onOpenSearchModal={() => {
                  setAddTargetGroupId(selectedStockGroup || stockGroups[0]?.id || null)
                  setSearchStockModalOpen(true)
                }}
                onDelete={handleDeleteStock}
                onEdit={handleEditItem}
                onMove={handleMoveItem}
              />
            ) : (
              <FundView darkMode={darkMode} onEditFund={handleEditItem} />
            )}
          </div>
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
      
      {/* 移动弹窗只负责选择目标分组，真正移动逻辑在 useHoldingActions */}
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
      
      {/* 股票搜索弹窗：提交后由 hook 统一处理状态与新增逻辑 */}
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
      
      {/* 基金搜索弹窗：与股票提交逻辑保持一致的状态收敛方式 */}
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
