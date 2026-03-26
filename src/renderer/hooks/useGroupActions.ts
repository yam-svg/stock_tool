import { UseGroupActionsParams } from '../types/hooks'
import {
  isHoldingFundGroup,
  isHoldingStockGroup,
  isSystemFundGroup,
  isSystemStockGroup,
} from '../../shared/groupConstants'

export function useGroupActions({
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
}: UseGroupActionsParams) {
  // 创建分组后立即清空输入，避免重复创建同名草稿。
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return
    if (activeTab === 'global') return

    if (activeTab === 'stock') {
      void createStockGroup(newGroupName)
    } else {
      void createFundGroup(newGroupName)
    }

    setNewGroupName('')
  }

  const handleGroupSelect = (id: string | null) => {
    if (activeTab === 'global') return
    if (activeTab === 'stock') {
      selectStockGroup(id)
    } else {
      selectFundGroup(id)
    }
  }

  const handleUpdateGroup = (id: string, newName: string) => {
    if (activeTab === 'global') return
    if ((activeTab === 'stock' && isSystemStockGroup(id)) || (activeTab === 'fund' && isSystemFundGroup(id))) {
      return
    }
    if (activeTab === 'stock') {
      void updateStockGroup(id, newName)
    } else {
      void updateFundGroup(id, newName)
    }
  }

  // 删除前检查是否包含项目；有内容时给出二次确认。
  const handleDeleteGroup = (id: string) => {
    if (activeTab === 'global') return
    if ((activeTab === 'stock' && isSystemStockGroup(id)) || (activeTab === 'fund' && isSystemFundGroup(id))) {
      return
    }
    const hasItems =
      activeTab === 'stock'
        ? stocks.some((s) => s.groupId === id)
        : funds.some((f) => f.groupId === id)

    if (hasItems && !confirm('确定要删除该分组吗？这将同时删除组内所有项目。')) {
      return
    }

    if (activeTab === 'stock') {
      void deleteStockGroup(id)
    } else {
      void deleteFundGroup(id)
    }
  }

  // 以“组内批量迁移”的方式实现分组移动，不改变项目本身数据结构。
  const handleMoveGroup = (groupId: string, targetGroupId: string) => {
    if (activeTab === 'global') return
    if ((activeTab === 'stock' && isSystemStockGroup(groupId)) || (activeTab === 'fund' && isSystemFundGroup(groupId))) {
      return
    }
    if (activeTab === 'stock') {
      const itemsToMove = stocks.filter((s) => s.groupId === groupId)
      itemsToMove.forEach((item) => {
        void moveStockToGroup(item.id, targetGroupId)
      })
    } else {
      const itemsToMove = funds.filter((f) => f.groupId === groupId)
      itemsToMove.forEach((item) => {
        void moveFundToGroup(item.id, targetGroupId)
      })
    }
  }

  // 记录"添加目标分组"，并按当前 tab 打开对应搜索弹窗。
  // 只阻止"我的持有"分组添加，允许自建分组和"全部"分组添加
  const handleAddToGroup = (groupId: string) => {
    if (activeTab === 'global') return
    if (
      (activeTab === 'stock' && isHoldingStockGroup(groupId)) ||
      (activeTab === 'fund' && isHoldingFundGroup(groupId))
    ) {
      return
    }
    setAddTargetGroupId(groupId)
    if (activeTab === 'stock') {
      setSearchStockModalOpen(true)
    } else {
      setSearchFundModalOpen(true)
    }
  }

  return {
    handleCreateGroup,
    handleGroupSelect,
    handleUpdateGroup,
    handleDeleteGroup,
    handleMoveGroup,
    handleAddToGroup,
  }
}
