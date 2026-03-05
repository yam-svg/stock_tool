import { Fund, FundGroup, FundQuote, Stock, StockGroup, StockQuote } from '../../shared/types'

export type AppTab = 'stock' | 'fund' | 'global'

export interface EditableHolding {
  id: string
  name: string
  costPrice?: number
  quantity?: number
  costNav?: number
  shares?: number
}

export interface UpdatePayload {
  name: string
  price: number
  quantity: number
}

export interface StockSubmitPayload {
  code: string
  name: string
  buyPrice: number
  quantity: number
  groupId: string
}

export interface FundSubmitPayload extends StockSubmitPayload {
  fundType?: string
  company?: string
  manager?: string
}

export type StockEditableFields = Pick<Stock, 'name' | 'costPrice' | 'quantity'>
export type FundEditableFields = Pick<Fund, 'name' | 'costNav' | 'shares'>

export type GroupedEntity = Pick<Stock, 'id' | 'groupId'>

export interface UseHoldingActionsParams {
  activeTab: AppTab
  editingItem: EditableHolding | null
  moveItemId: string | null
  setMoveModalOpen: (open: boolean) => void
  setMoveItemId: (id: string | null) => void
  setEditModalOpen: (open: boolean) => void
  setEditItem: (item: EditableHolding | null) => void
  setIsUpdating: (updating: boolean) => void
  setIsAddingStock: (adding: boolean) => void
  setIsAddingFund: (adding: boolean) => void
  setSearchStockModalOpen: (open: boolean) => void
  setSearchFundModalOpen: (open: boolean) => void
  setAddTargetGroupId: (id: string | null) => void
  moveStockToGroup: (stockId: string, groupId: string) => Promise<void>
  moveFundToGroup: (fundId: string, groupId: string) => Promise<void>
  updateStock: (id: string, updates: Partial<StockEditableFields>) => Promise<void>
  updateFund: (id: string, updates: Partial<FundEditableFields>) => Promise<void>
  deleteStock: (id: string) => Promise<void>
  addStock: (payload: Omit<Stock, 'id' | 'createdAt'>) => Promise<void>
  addFund: (payload: Omit<Fund, 'id' | 'createdAt'>) => Promise<void>
}

export interface UseGroupActionsParams {
  activeTab: AppTab
  newGroupName: string
  setNewGroupName: (name: string) => void
  createStockGroup: (name: string) => Promise<void>
  createFundGroup: (name: string) => Promise<void>
  selectStockGroup: (groupId: string | null) => void
  selectFundGroup: (groupId: string | null) => void
  updateStockGroup: (id: string, name: string) => Promise<void>
  updateFundGroup: (id: string, name: string) => Promise<void>
  deleteStockGroup: (id: string) => Promise<void>
  deleteFundGroup: (id: string) => Promise<void>
  moveStockToGroup: (stockId: string, newGroupId: string) => Promise<void>
  moveFundToGroup: (fundId: string, newGroupId: string) => Promise<void>
  stocks: GroupedEntity[]
  funds: GroupedEntity[]
  setAddTargetGroupId: (id: string | null) => void
  setSearchStockModalOpen: (open: boolean) => void
  setSearchFundModalOpen: (open: boolean) => void
}

export interface UsePortfolioMetricsParams {
  activeTab: AppTab
  stocks: Stock[]
  stockQuotes: Record<string, StockQuote>
  funds: Fund[]
  fundQuotes: Record<string, FundQuote>
  selectedStockGroup: string | null
  stockGroups: StockGroup[]
  fundGroups: FundGroup[]
}
