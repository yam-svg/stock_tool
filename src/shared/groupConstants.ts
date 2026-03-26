export const ALL_STOCK_GROUP_ID = 'system-all-stocks'
export const ALL_FUND_GROUP_ID = 'system-all-funds'
export const ALL_FUTURE_GROUP_ID = 'system-all-futures'
export const HOLDING_STOCK_GROUP_ID = 'system-holding-stocks'
export const HOLDING_FUND_GROUP_ID = 'system-holding-funds'
export const HOLDING_FUTURE_GROUP_ID = 'system-holding-futures'

export const ALL_STOCK_GROUP_NAME = '全部股票'
export const ALL_FUND_GROUP_NAME = '全部基金'
export const ALL_FUTURE_GROUP_NAME = '全部期货'
export const HOLDING_STOCK_GROUP_NAME = '我的持有'
export const HOLDING_FUND_GROUP_NAME = '我的持有'
export const HOLDING_FUTURE_GROUP_NAME = '我的持有'

export const isAllStockGroup = (groupId?: string | null) => groupId === ALL_STOCK_GROUP_ID
export const isAllFundGroup = (groupId?: string | null) => groupId === ALL_FUND_GROUP_ID
export const isAllFutureGroup = (groupId?: string | null) => groupId === ALL_FUTURE_GROUP_ID

export const isHoldingStockGroup = (groupId?: string | null) => groupId === HOLDING_STOCK_GROUP_ID
export const isHoldingFundGroup = (groupId?: string | null) => groupId === HOLDING_FUND_GROUP_ID
export const isHoldingFutureGroup = (groupId?: string | null) => groupId === HOLDING_FUTURE_GROUP_ID

export const isSystemStockGroup = (groupId?: string | null) =>
  isAllStockGroup(groupId) || isHoldingStockGroup(groupId)

export const isSystemFundGroup = (groupId?: string | null) =>
  isAllFundGroup(groupId) || isHoldingFundGroup(groupId)

export const isSystemFutureGroup = (groupId?: string | null) =>
  isAllFutureGroup(groupId) || isHoldingFutureGroup(groupId)

