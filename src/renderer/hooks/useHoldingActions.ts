import {
  EditableHolding,
  FundSubmitPayload,
  StockSubmitPayload,
  UpdatePayload,
  UseHoldingActionsParams,
} from '../types/hooks'

export function useHoldingActions({
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
}: UseHoldingActionsParams) {
  const handleDeleteStock = (id: string) => {
    void deleteStock(id)
  }

  // 单项移动完成后统一收敛弹窗状态，避免残留上下文。
  const handleMoveItem = (itemId: string, newGroupId: string) => {
    if (activeTab === 'global') return
    if (activeTab === 'stock') {
      void moveStockToGroup(itemId, newGroupId)
    } else {
      void moveFundToGroup(itemId, newGroupId)
    }
    setMoveModalOpen(false)
    setMoveItemId(null)
  }

  // 由 MoveModal 传入目标分组，再桥接到实际移动逻辑。
  const handleMoveModalConfirm = (groupId: string) => {
    if (moveItemId) {
      handleMoveItem(moveItemId, groupId)
    }
  }

  const handleEditItem = (item: EditableHolding) => {
    if (activeTab === 'global') return
    setEditItem(item)
    setEditModalOpen(true)
  }

  // 编辑提交根据 tab 路由到 stock/fund，不在视图层分支。
  const handleUpdateItem = async (data: UpdatePayload) => {
    if (activeTab === 'global') return
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

  // 提交新增股票后统一关闭弹窗并清空目标分组。
  const handleStockSubmit = async (payload: StockSubmitPayload) => {
    if (activeTab === 'global') return
    const { code, name, buyPrice, quantity, groupId } = payload
    if (!groupId) return

    setIsAddingStock(true)
    try {
      await addStock({
        symbol: code,
        name,
        groupId,
        costPrice: buyPrice || 0,
        quantity: quantity || 0,
      })
      setSearchStockModalOpen(false)
      setAddTargetGroupId(null)
    } finally {
      setIsAddingStock(false)
    }
  }

  // 提交新增基金与股票保持一致的状态收敛策略。
  const handleFundSubmit = async (payload: FundSubmitPayload) => {
    if (activeTab === 'global') return
    const { code, name, buyPrice, quantity, groupId, fundType, company, manager } = payload
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
  }

  return {
    handleDeleteStock,
    handleMoveItem,
    handleMoveModalConfirm,
    handleEditItem,
    handleUpdateItem,
    handleStockSubmit,
    handleFundSubmit,
  }
}
