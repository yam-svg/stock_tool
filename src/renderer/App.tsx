import React, { useState, useEffect } from "react";
import { useStore } from "./store";
import {
  Header,
  Sidebar,
  StockForm,
  StockCard,
  FundView,
  MoveModal,
  AddStockModal,
} from "./components";

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
    deleteStock,
    deleteFund,
    moveStockToGroup,
    moveFundToGroup,
    selectedStockGroup,
    selectedFundGroup,
    selectStockGroup,
    selectFundGroup,
    funds,
    fundQuotes,
  } = useStore();

  const [newGroupName, setNewGroupName] = useState("");
  const [newStock, setNewStock] = useState({
    code: "",
    name: "",
    buyPrice: 0,
    quantity: 0,
    groupId: "",
  });
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveItemId, setMoveItemId] = useState<string | null>(null);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [isAddingFund, setIsAddingFund] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addTargetGroupId, setAddTargetGroupId] = useState<string | null>(null);

  // 初始化应用
  useEffect(() => {
    const init = async () => {
      await useStore.getState().initialize();
    };
    init();
  }, []);

  // 设置刷新定时器
  useEffect(() => {
    if (!refreshConfig.enabled) return;

    const stockTimer = setInterval(() => {
      refreshStockQuotes();
    }, refreshConfig.stockInterval);

    const fundTimer = setInterval(() => {
      refreshFundQuotes();
    }, refreshConfig.fundInterval);

    return () => {
      clearInterval(stockTimer);
      clearInterval(fundTimer);
    };
  }, [
    refreshConfig.enabled,
    refreshConfig.stockInterval,
    refreshConfig.fundInterval,
  ]);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    if (activeTab === "stock") {
      createStockGroup(newGroupName);
    } else {
      createFundGroup(newGroupName);
    }
    setNewGroupName("");
  };

  const handleAddStock = () => {
    // 表单验证
    const errors: Record<string, string> = {};

    if (!newStock.code.trim()) {
      errors.code = "请输入股票代码";
    }

    if (!newStock.name.trim()) {
      errors.name = "请输入股票名称";
    }

    // 价格和数量可选，但如果填写了必须大于 0
    if (newStock.buyPrice < 0) {
      errors.buyPrice = "买入价格不能为负数";
    }

    if (newStock.quantity < 0) {
      errors.quantity = "持仓数量不能为负数";
    }

    // 如果有错误，显示错误并返回
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // 清空错误
    setFormErrors({});
    setIsAddingStock(true);

    try {
      //确保有分组
      let groupId = newStock.groupId;
      if (!groupId) {
        const defaultGroup = stockGroups[0];
        if (defaultGroup) {
          groupId = defaultGroup.id;
        } else {
          // 如果没有分组，创建一个默认分组
          createStockGroup("默认分组");
          return;
        }
      }

      addStock({
        symbol: newStock.code,
        name: newStock.name,
        groupId: groupId,
        costPrice: newStock.buyPrice || 0,
        quantity: newStock.quantity || 0,
      });

      //清空表单
      setNewStock({
        code: "",
        name: "",
        buyPrice: 0,
        quantity: 0,
        groupId: "",
      });
    } catch (error) {
      console.error("添加股票失败:", error);
    } finally {
      setIsAddingStock(false);
    }
  };

  const handleDeleteStock = (id: string) => {
    deleteStock(id);
  };

  const handleManualRefresh = () => {
    refreshStockQuotes();
    refreshFundQuotes();
  };

  const handleMoveItem = (itemId: string, newGroupId: string) => {
    if (activeTab === "stock") {
      moveStockToGroup(itemId, newGroupId);
    } else {
      moveFundToGroup(itemId, newGroupId);
    }
    setMoveModalOpen(false);
    setMoveItemId(null);
  };

  const stockProfit = stocks.reduce((acc, stock) => {
    const quote = stockQuotes[stock.symbol];
    const currentPrice = quote?.price || 0;
    const cost = stock.costPrice * stock.quantity;
    const marketValue = currentPrice * stock.quantity;
    const profit = marketValue - cost;
    return acc + profit;
  }, 0);

  const fundProfit = funds.reduce((acc, fund) => {
    const quote = fundQuotes[fund.code];
    const currentNav = quote?.nav || 0;
    const cost = fund.costNav * fund.shares;
    const marketValue = currentNav * fund.shares;
    const profit = marketValue - cost;
    return acc + profit;
  }, 0);

  const totalProfit = stockProfit + fundProfit;

  const visibleStocks = selectedStockGroup
    ? stocks.filter((s) => s.groupId === selectedStockGroup)
    : [];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100"
          : "bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-800"
      }`}
    >
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
      <div className="flex">
        {/* Sidebar 分组管理 */}
        <Sidebar
          darkMode={darkMode}
          activeTab={activeTab}
          groups={activeTab === "stock" ? stockGroups : fundGroups}
          newGroupName={newGroupName}
          onGroupSelect={(id) => {
            if (activeTab === "stock") {
              selectStockGroup(id);
            } else {
              selectFundGroup(id);
            }
          }}
          onGroupCreate={handleCreateGroup}
          onGroupNameChange={setNewGroupName}
          stocksCount={
            activeTab === "stock"
              ? stockGroups.reduce(
                  (acc, group) => {
                    acc[group.id] = stocks.filter(
                      (s) => s.groupId === group.id,
                    ).length;
                    return acc;
                  },
                  {} as Record<string, number>,
                )
              : fundGroups.reduce(
                  (acc, group) => {
                    acc[group.id] = funds.filter(
                      (f) => f.groupId === group.id,
                    ).length;
                    return acc;
                  },
                  {} as Record<string, number>,
                )
          }
          onUpdateGroup={(id, newName) => {
            if (activeTab === "stock") {
              updateStockGroup(id, newName);
            } else {
              updateFundGroup(id, newName);
            }
          }}
          onDeleteGroup={(id) => {
            // 检查分组内是否有内容
            const hasItems =
              activeTab === "stock"
                ? stocks.some((s) => s.groupId === id)
                : funds.some((f) => f.groupId === id);

            if (hasItems) {
              // 分组内有内容，需要确认
              if (confirm("确定要删除该分组吗？这将同时删除组内所有项目。")) {
                if (activeTab === "stock") {
                  deleteStockGroup(id);
                } else {
                  deleteFundGroup(id);
                }
              }
            } else {
              // 分组内没有内容，直接删除
              if (activeTab === "stock") {
                deleteStockGroup(id);
              } else {
                deleteFundGroup(id);
              }
            }
          }}
          onMoveGroup={(groupId, targetGroupId) => {
            // 移动该分组内的所有项目到目标分组
            if (activeTab === "stock") {
              const itemsToMove = stocks.filter((s) => s.groupId === groupId);
              itemsToMove.forEach((item) => {
                moveStockToGroup(item.id, targetGroupId);
              });
            } else {
              const itemsToMove = funds.filter((f) => f.groupId === groupId);
              itemsToMove.forEach((item) => {
                moveFundToGroup(item.id, targetGroupId);
              });
            }
          }}
          selectedGroupId={
            activeTab === "stock" ? selectedStockGroup : selectedFundGroup
          }
          onAddToGroup={(groupId) => {
            setAddTargetGroupId(groupId);
            setAddModalOpen(true);
          }}
        />

        {/*右内容区域 */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {activeTab === "stock" ? (
              <div className="space-y-6">
                {/* 股票列表标题 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold">股票持仓</h2>
                  </div>
                  {visibleStocks.length > 0 && (
                    <div
                      className={`px-3 py-1 rounded-md text-sm ${
                        darkMode ? "bg-gray-800/50" : "bg-white/50"
                      } border ${
                        darkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div className="text-xs text-gray-500">持仓数量</div>
                      <div className="font-bold text-blue-500">
                        {visibleStocks.length}
                      </div>
                    </div>
                  )}
                </div>

                {/* 添加股票表单：当分组为空时显示 */}
                {!(selectedStockGroup && visibleStocks.length > 0) && (
                  <StockForm
                    darkMode={darkMode}
                    newStock={newStock}
                    stockGroups={stockGroups}
                    onStockChange={(updates) => {
                      setNewStock({ ...newStock, ...updates });
                      // 清空对应字段的错误
                      if (formErrors[Object.keys(updates)[0]]) {
                        setFormErrors({
                          ...formErrors,
                          [Object.keys(updates)[0]]: "",
                        });
                      }
                    }}
                    onAddStock={handleAddStock}
                    isAdding={isAddingStock}
                    errors={formErrors}
                  />
                )}

                {/* 股票列表 */}
                <div className="space-y-3">
                  {visibleStocks.map((stock) => (
                    <StockCard
                      key={stock.id}
                      darkMode={darkMode}
                      stock={stock}
                      quote={stockQuotes[stock.symbol]}
                      groups={stockGroups}
                      onDelete={handleDeleteStock}
                      onMove={(stockId, groupId) =>
                        handleMoveItem(stockId, groupId)
                      }
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

      {/* 移动模态框 */}
      <MoveModal
        darkMode={darkMode}
        isOpen={moveModalOpen}
        onClose={() => {
          setMoveModalOpen(false);
          setMoveItemId(null);
        }}
        onMove={(groupId) => moveItemId && handleMoveItem(moveItemId, groupId)}
        groups={activeTab === "stock" ? stockGroups : fundGroups}
        currentGroupId={undefined}
        title={`移动到${activeTab === "stock" ? "股票" : "基金"}分组`}
      />

      {/* 添加持仓模态框 */}
      <AddStockModal
        darkMode={darkMode}
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setAddTargetGroupId(null);
        }}
        type={activeTab}
        group={(activeTab === "stock" ? stockGroups : fundGroups).find(
          (g) => g.id === addTargetGroupId,
        )}
        isSubmitting={activeTab === "stock" ? isAddingStock : isAddingFund}
        onSubmit={async ({ code, name, buyPrice, quantity }) => {
          if (!addTargetGroupId) return;
          if (activeTab === "stock") {
            setIsAddingStock(true);
            try {
              await addStock({
                symbol: code,
                name,
                groupId: addTargetGroupId,
                costPrice: buyPrice || 0,
                quantity: quantity || 0,
              });
              setAddModalOpen(false);
              setAddTargetGroupId(null);
            } finally {
              setIsAddingStock(false);
            }
          } else {
            setIsAddingFund(true);
            try {
              await addFund({
                code: code,
                name,
                groupId: addTargetGroupId,
                costNav: buyPrice || 0,
                shares: quantity || 0,
              });
              setAddModalOpen(false);
              setAddTargetGroupId(null);
            } finally {
              setIsAddingFund(false);
            }
          }
        }}
      />
    </div>
  );
};

export default App;
