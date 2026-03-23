export const ALL_STOCK_GROUP_ID = 'system-all-stocks'
export const ALL_FUND_GROUP_ID = 'system-all-funds'

export const ALL_STOCK_GROUP_NAME = '全部股票'
export const ALL_FUND_GROUP_NAME = '全部基金'

export const isSystemStockGroup = (groupId?: string | null) => groupId === ALL_STOCK_GROUP_ID
export const isSystemFundGroup = (groupId?: string | null) => groupId === ALL_FUND_GROUP_ID

