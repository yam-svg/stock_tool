import { LayoutGrid, List, Search, Menu } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import {
  EditModal,
  FundView,
  Header,
  MoveModal,
  SearchFundModal,
  SearchStockModal,
  Sidebar,
  StockCard,
  StockList,
} from './components'
import { useStore } from './store'
import { Button } from './ui'

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
  } = useStore()
  
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
  const [editingItem, setEditItem] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // 初始化应用
  useEffect(() => {
    const init = async () => {
      await useStore.getState().initialize()
    }
    init()
  }, [])
  
  // 设置刷新定时器
  useEffect(() => {
    if (!refreshConfig.enabled) return
    
    const stockTimer = setInterval(() => {
      refreshStockQuotes()
    }, refreshConfig.stockInterval)
    
    const fundTimer = setInterval(() => {
      refreshFundQuotes()
    }, refreshConfig.fundInterval)
    
    return () => {
      clearInterval(stockTimer)
      clearInterval(fundTimer)
    }
  }, [
    refreshConfig.enabled,
    refreshConfig.stockInterval,
    refreshConfig.fundInterval,
  ])
  
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return
    if (activeTab === 'stock') {
      createStockGroup(newGroupName)
    } else {
      createFundGroup(newGroupName)
    }
    setNewGroupName('')
  }
  
  const handleDeleteStock = (id: string) => {
    deleteStock(id)
  }
  
  const handleManualRefresh = () => {
    refreshStockQuotes()
    refreshFundQuotes()
  }
  
  const handleMoveItem = (itemId: string, newGroupId: string) => {
    if (activeTab === 'stock') {
      moveStockToGroup(itemId, newGroupId)
    } else {
      moveFundToGroup(itemId, newGroupId)
    }
    setMoveModalOpen(false)
    setMoveItemId(null)
  }
  
  const stockProfit = stocks.reduce((acc, stock) => {
    const quote = stockQuotes[stock.symbol]
    const currentPrice = quote?.price || 0
    const cost = stock.costPrice * stock.quantity
    const marketValue = currentPrice * stock.quantity
    const profit = marketValue - cost
    return acc + profit
  }, 0)
  
  const fundProfit = funds.reduce((acc, fund) => {
    const quote = fundQuotes[fund.code]
    const currentNav = quote?.nav || 0
    const cost = fund.costNav * fund.shares
    const marketValue = currentNav * fund.shares
    const profit = marketValue - cost
    return acc + profit
  }, 0)
  
  const handleEditItem = (item: any) => {
    setEditItem(item)
    setEditModalOpen(true)
  }
  
  const handleUpdateItem = async (data: { name: string; price: number; quantity: number }) => {
    if (!editingItem) return
    setIsUpdating(true)
    try {
      if (activeTab === 'stock') {
        await updateStock(editingItem.id, {
          name: data.name,
          costPrice: data.price,
          quantity: data.quantity,
        })
      } else {
        await updateFund(editingItem.id, {
          name: data.name,
          costNav: data.price,
          shares: data.quantity,
        })
      }
      setEditModalOpen(false)
      setEditItem(null)
    } finally {
      setIsUpdating(false)
    }
  }
  
  const visibleStocks = selectedStockGroup
    ? stocks.filter((s) => s.groupId === selectedStockGroup)
    : []
  
  // 响应式处理：监听窗口宽度变化
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      // 当窗口宽度小于 1024px 时自动收起，大于 1280px 时自动展开
      if (width < 1024 && !sidebarCollapsed) {
        toggleSidebar()
      } else if (width >= 1280 && sidebarCollapsed) {
        toggleSidebar()
      }
    }

    // 初始检查
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarCollapsed, toggleSidebar])
  
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
        setActiveTab={setActiveTab}
        toggleDarkMode={toggleDarkMode}
        toggleRefresh={toggleRefresh}
        onManualRefresh={handleManualRefresh}
      />
      
      {/* 主内容区域 */}
      <div className="flex relative w-full">
        {/* 侧边栏切换按钮 - 展开按钮 */}
        {sidebarCollapsed && (
          <button
            onClick={() => toggleSidebar()}
            className={`fixed left-0 top-12 z-50 p-2 rounded-r-lg transition-all duration-300 shadow-lg pointer-events-auto ${
              darkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
            } border border-l-0 hover:shadow-xl`}
            title="展开侧边栏"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Sidebar 分组管理 */}
        <Sidebar
          darkMode={darkMode}
          activeTab={activeTab}
          groups={activeTab === 'stock' ? stockGroups : fundGroups}
          newGroupName={newGroupName}
          onGroupSelect={(id) => {
            if (activeTab === 'stock') {
              selectStockGroup(id)
            } else {
              selectFundGroup(id)
            }
          }}
          onGroupCreate={handleCreateGroup}
          onGroupNameChange={setNewGroupName}
          stocksCount={
            activeTab === 'stock'
              ? stockGroups.reduce(
                (acc, group) => {
                  acc[group.id] = stocks.filter(
                    (s) => s.groupId === group.id,
                  ).length
                  return acc
                },
                {} as Record<string, number>,
              )
              : fundGroups.reduce(
                (acc, group) => {
                  acc[group.id] = funds.filter(
                    (f) => f.groupId === group.id,
                  ).length
                  return acc
                },
                {} as Record<string, number>,
              )
          }
          onUpdateGroup={(id, newName) => {
            if (activeTab === 'stock') {
              updateStockGroup(id, newName)
            } else {
              updateFundGroup(id, newName)
            }
          }}
          onDeleteGroup={(id) => {
            // 检查分组内是否有内容
            const hasItems =
              activeTab === 'stock'
                ? stocks.some((s) => s.groupId === id)
                : funds.some((f) => f.groupId === id)
            
            if (hasItems) {
              // 分组内有内容，需要确认
              if (confirm('确定要删除该分组吗？这将同时删除组内所有项目。')) {
                if (activeTab === 'stock') {
                  deleteStockGroup(id)
                } else {
                  deleteFundGroup(id)
                }
              }
            } else {
              // 分组内没有内容，直接删除
              if (activeTab === 'stock') {
                deleteStockGroup(id)
              } else {
                deleteFundGroup(id)
              }
            }
          }}
          onMoveGroup={(groupId, targetGroupId) => {
            // 移动该分组内的所有项目到目标分组
            if (activeTab === 'stock') {
              const itemsToMove = stocks.filter((s) => s.groupId === groupId)
              itemsToMove.forEach((item) => {
                moveStockToGroup(item.id, targetGroupId)
              })
            } else {
              const itemsToMove = funds.filter((f) => f.groupId === groupId)
              itemsToMove.forEach((item) => {
                moveFundToGroup(item.id, targetGroupId)
              })
            }
          }}
          selectedGroupId={
            activeTab === 'stock' ? selectedStockGroup : selectedFundGroup
          }
          onAddToGroup={(groupId) => {
            setAddTargetGroupId(groupId)
            if (activeTab === 'stock') {
              setSearchStockModalOpen(true)
            } else {
              setSearchFundModalOpen(true)
            }
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
        
        {/*右内容区域 */}
        <div className="flex-1 p-4 overflow-auto w-full">
          <div className="w-full">
            {activeTab === 'stock' ? (
              <div className="space-y-6">
                {/* 股票列表标题 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold">股票持仓</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* 视图模式切换 */}
                    <div className={`flex items-center rounded-md overflow-hidden border ${
                      darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'
                    }`}>
                      <button
                        onClick={() => setStockViewMode('card')}
                        className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                          stockViewMode === 'card'
                            ? darkMode
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-500 text-white'
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
                            ? darkMode
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-500 text-white'
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
                        } border ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}
                      >
                        <div className="text-xs text-gray-500">持仓数量</div>
                        <div className="font-bold text-blue-500">
                          {visibleStocks.length}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 添加股票表单：当分组为空时显示 */}
                {!(selectedStockGroup && visibleStocks.length > 0) && (
                  <div className="p-4 rounded-xl border">
                    <h3 className="text-sm font-semibold mb-4 flex items-center space-x-2">
                      <Search className="w-4 h-4 text-blue-500" />
                      <span>搜索并添加股票</span>
                    </h3>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setAddTargetGroupId(selectedStockGroup || stockGroups[0]?.id || null)
                        setSearchStockModalOpen(true)
                      }}
                      leftIcon={<Search className="w-3.5 h-3.5" />}
                    >
                      搜索添加股票
                    </Button>
                  </div>
                )}
                
                {/* 股票列表 - 卡片或列表视图 */}
                {stockViewMode === 'card' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {visibleStocks.map((stock) => (
                      <StockCard
                        key={stock.id}
                        darkMode={darkMode}
                        stock={stock}
                        quote={stockQuotes[stock.symbol]}
                        groups={stockGroups}
                        onDelete={handleDeleteStock}
                        onEdit={handleEditItem}
                        onMove={(stockId, groupId) =>
                          handleMoveItem(stockId, groupId)
                        }
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
                      onDelete={handleDeleteStock}
                      onEdit={handleEditItem}
                      onMove={(stockId: string, groupId: string) => handleMoveItem(stockId, groupId)}
                    />
                  )
                )}
              </div>
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
          price: activeTab === 'stock' ? editingItem?.costPrice : editingItem?.costNav || 0,
          quantity: activeTab === 'stock' ? editingItem?.quantity : editingItem?.shares || 0,
        }}
        onSubmit={handleUpdateItem}
        isSubmitting={isUpdating}
      />
      
      {/* 移动模态框 */}
      <MoveModal
        darkMode={darkMode}
        isOpen={moveModalOpen}
        onClose={() => {
          setMoveModalOpen(false)
          setMoveItemId(null)
        }}
        onMove={(groupId) => moveItemId && handleMoveItem(moveItemId, groupId)}
        groups={activeTab === 'stock' ? stockGroups : fundGroups}
        currentGroupId={undefined}
        title={`移动到${activeTab === 'stock' ? '股票' : '基金'}分组`}
      />
      
      {/* 添加股票模态框 */}
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
          onSubmit={async ({ code, name, buyPrice, quantity, groupId }) => {
            if (!groupId) return
            setIsAddingStock(true)
            try {
              await addStock({
                symbol: code,
                name,
                groupId: groupId,
                costPrice: buyPrice || 0,
                quantity: quantity || 0,
              })
              setSearchStockModalOpen(false)
              setAddTargetGroupId(null)
            } finally {
              setIsAddingStock(false)
            }
          }}
        />
      )}
      
      {/* 添加基金模态框 */}
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
          onSubmit={async ({
            code,
            name,
            buyPrice,
            quantity,
            groupId,
            fundType,
            company,
            manager,
          }: {
            code: string
            name: string
            buyPrice: number
            quantity: number
            groupId: string
            fundType?: string
            company?: string
            manager?: string
          }) => {
            if (!groupId) return
            setIsAddingFund(true)
            try {
              await addFund({
                code,
                name,
                groupId,
                costNav: buyPrice || 0,
                shares: quantity || 0,
                fundType,
                company,
                manager,
              })
              setSearchFundModalOpen(false)
              setAddTargetGroupId(null)
            } finally {
              setIsAddingFund(false)
            }
          }}
        />
      )}
    </div>
  )
}

export default App
