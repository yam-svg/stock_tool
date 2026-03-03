import React, { useState, useEffect } from 'react'
import { useStore } from './store'
import { Header, Sidebar, StockForm, StockCard, FundView } from './components'

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
    addStock
  } = useStore()

  const [newGroupName, setNewGroupName] = useState('')
  const [newStock, setNewStock] = useState({
    code: '',
    name: '',
    buyPrice: 0,
    quantity: 0,
    groupId: ''
  })

  // 初始化应用
  useEffect(() => {
    const init = async () => {
      await useStore.getState().initialize()
      // 如果没有分组，创建默认分组
      if (stockGroups.length === 0) {
        createStockGroup('我的股票')
      }
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
  }, [refreshConfig.enabled, refreshConfig.stockInterval, refreshConfig.fundInterval])

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return
    if (activeTab === 'stock') {
      createStockGroup(newGroupName)
    } else {
      createFundGroup(newGroupName)
    }
    setNewGroupName('')
  }

  const handleAddStock = () => {
    if (!newStock.code || !newStock.name || !newStock.buyPrice || !newStock.quantity) return
    
    //确保有分组
    let groupId = stockGroups[0]?.id
    if (!groupId) {
      // 如果没有分组，创建一个默认分组
      createStockGroup('默认分组')
      return
    }
    
    addStock({
      symbol: newStock.code,
      name: newStock.name,
      groupId: groupId,
      costPrice: newStock.buyPrice,
      quantity: newStock.quantity
    })
    setNewStock({
      code: '',
      name: '',
      buyPrice: 0,
      quantity: 0,
      groupId: ''
    })
  }

  const handleDeleteStock = (id: string) => {
    // TODO: 实现删除股票功能
    console.log('删除股票:', id)
  }

  const handleManualRefresh = () => {
    refreshStockQuotes()
    refreshFundQuotes()
  }

  const totalProfit = stocks.reduce((acc, stock) => {
    const quote = stockQuotes[stock.symbol]
    const currentPrice = quote?.price || 0
    const cost = stock.costPrice * stock.quantity
    const marketValue = currentPrice * stock.quantity
    const profit = marketValue - cost
    return acc + profit
  }, 0)

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-800'
    }`}>
      {/* Header 导航栏 */}
      <Header
        darkMode={darkMode}
        activeTab={activeTab}
        totalProfit={totalProfit}
        refreshConfig={refreshConfig}
        setActiveTab={setActiveTab}
        toggleDarkMode={toggleDarkMode}
        toggleRefresh={toggleRefresh}
        onManualRefresh={handleManualRefresh}
      />

      {/* 主内容区域 */}
      <div className="flex h-[calc(100vh-41px)]">
        {/* Sidebar 分组管理 */}
        <Sidebar
          darkMode={darkMode}
          activeTab={activeTab}
          groups={activeTab === 'stock' ? stockGroups : fundGroups}
          newGroupName={newGroupName}
          onGroupSelect={() => {}}
          onGroupCreate={handleCreateGroup}
          onGroupNameChange={setNewGroupName}
          stocksCount={activeTab === 'stock' ? stockGroups.reduce((acc, group) => {
            acc[group.id] = stocks.filter(s => s.groupId === group.id).length
            return acc
          }, {} as Record<string, number>) : {}}
        />

        {/*右内容区域 */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'stock' ? (
              <div className="space-y-6">
                {/* 股票列表标题 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold">股票持仓</h2>
                  </div>
                  {stocks.length > 0 && (
                    <div className={`px-3 py-1 rounded-md text-sm ${
                      darkMode ? 'bg-gray-800/50' : 'bg-white/50'
                    } border ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="text-xs text-gray-500">持仓数量</div>
                      <div className="font-bold text-blue-500">{stocks.length}</div>
                    </div>
                  )}
                </div>
                
                {/* 添加股票表单 */}
                <StockForm
                  darkMode={darkMode}
                  newStock={newStock}
                  stockGroups={stockGroups}
                  onStockChange={(updates) => setNewStock({...newStock, ...updates})}
                  onAddStock={handleAddStock}
                />

                {/* 股票列表 */}
                <div className="space-y-3">
                  {stocks.map(stock => (
                    <StockCard
                      key={stock.id}
                      darkMode={darkMode}
                      stock={stock}
                      quote={stockQuotes[stock.symbol]}
                      onDelete={handleDeleteStock}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <FundView darkMode={darkMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App
