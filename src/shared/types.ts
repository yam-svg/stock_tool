//分组接口
export interface StockGroup {
  id: string
  name: string
  createdAt: number
}

//持仓接口
export interface Stock {
  id: string
  symbol: string
  name: string
  groupId: string
  costPrice: number
  quantity: number
  createdAt: number
  sortOrder?: number  // 排序顺序
}

//行情数据接口
export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  updateTime: number
}

// 股票搜索结果接口
export interface StockSearchResult {
  symbol: string
  name: string
}

//基金分组接口
export interface FundGroup {
  id: string
  name: string
  createdAt: number
}

// 期货分组接口
export interface FutureGroup {
  id: string
  name: string
  createdAt: number
}

// 基金持仓接口
export interface Fund {
  id: string
  code: string
  name: string
  groupId: string
  costNav: number
  shares: number
  createdAt: number
  sortOrder?: number  // 排序顺序
  // 下面字段来自基金搜索结果中的基础信息，仅在当前会话中使用，不一定持久化
  fundType?: string        // 基金类型，如 混合型、债券型 等
  company?: string         // 基金公司
  manager?: string         // 基金经理
}

// 期货基础数据接口
export interface Future {
  id: string
  symbol: string
  name: string
  groupId: string
  createdAt: number
  sortOrder?: number
}

//基金行情数据接口
export interface FundQuote {
  code: string
  name: string
  nav: number
  change: number
  changePercent: number
  date: string
  updateTime: string
}

//期货行情数据接口
export interface FutureQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  updateTime: string
}

// 基金搜索结果接口
export interface FundSearchResult {
  code: string
  name: string
  _id: string
  CODE: string
  NAME: string
  JP: string
  CATEGORY: number
  CATEGORYDESC: string
  STOCKMARKET: string | null
  BACKCODE: string
  MatchCount: number

  FundBaseInfo: FundBaseInfo | null
  StockHolder: unknown | null
  ZTJJInfo: unknown[]
  SEARCHWEIGHT: number
  NEWTEXCH: string
}

export interface FundBaseInfo {
  _id: string
  FCODE: string
  SHORTNAME: string
  JJGSID: string
  JJGS: string
  JJJLID: string
  JJJL: string
  FUNDTYPE: string
  ISBUY: string
  FTYPE: string
  MINSG: number
  JJGSBID: number
  OTHERNAME: string
  DWJZ: number
  FSRQ: string
  RSFUNDTYPE: string
  NAVURL: string
}

//期货搜索结果接口
export interface FutureSearchResult {
  symbol: string
  name: string
  market: 'CN' | 'INTL'
}

//持仓收益计算结果接口
export interface PositionProfit {
  cost: number
  marketValue: number
  profit: number
  profitRate: number
}

//刷新控制接口
export interface RefreshConfig {
  stockInterval: number //刷新间隔（毫秒）
  fundInterval: number   //基金刷新间隔（毫秒）
  enabled: boolean       //全局刷新开关
}

//应用状态接口
export interface AppState {
  activeTab: 'stock' | 'fund' | 'future' | 'global'
  refreshConfig: RefreshConfig
  darkMode: boolean
  stockViewMode?: 'card' | 'list'
  fundViewMode?: 'card' | 'list'
  futureViewMode?: 'card' | 'list'
  globalViewMode?: 'card' | 'list'
}

// 全球市场指数数据接口
export interface GlobalIndexQuote {
  symbol: string
  code: string
  name: string
  market: string
  value: number
  changePercent: number
  isOpen: boolean
  updateTime: number
}

export type GlobalTrendPeriod = 'today' | 'history'

export interface GlobalIndexTrendPoint {
  timestamp: number
  value: number
  label: string
}

export interface GlobalIndexTrendData {
  symbol: string
  name: string
  period: GlobalTrendPeriod
  points: GlobalIndexTrendPoint[]
  previousClose: number
}

// 数据库API接口
export interface DatabaseAPI {
  // 分组操作
  createStockGroup: (name: string) => Promise<StockGroup>
  createFundGroup: (name: string) => Promise<FundGroup>
  createFutureGroup: (name: string) => Promise<FutureGroup>
  getStockGroups: () => Promise<StockGroup[]>
  getFundGroups: () => Promise<FundGroup[]>
  getFutureGroups: () => Promise<FutureGroup[]>
  updateStockGroup: (id: string, name: string) => Promise<void>
  updateFundGroup: (id: string, name: string) => Promise<void>
  updateFutureGroup: (id: string, name: string) => Promise<void>
  deleteStockGroup: (id: string) => Promise<void>
  deleteFundGroup: (id: string) => Promise<void>
  deleteFutureGroup: (id: string) => Promise<void>

  //股票操作
  createStock: (stock: Omit<Stock, 'id' | 'createdAt'>) => Promise<Stock>
  getStocks: (groupId?: string) => Promise<Stock[]>
  updateStock: (id: string, updates: Partial<Omit<Stock, 'id' | 'createdAt'>>) => Promise<void>
  deleteStock: (id: string) => Promise<void>
  updateStocksSortOrder: (updates: Array<{ id: string; sortOrder: number }>) => Promise<void>

  //基金操作
  createFund: (fund: Omit<Fund, 'id' | 'createdAt'>) => Promise<Fund>
  getFunds: (groupId?: string) => Promise<Fund[]>
  updateFund: (id: string, updates: Partial<Omit<Fund, 'id' | 'createdAt'>>) => Promise<void>
  deleteFund: (id: string) => Promise<void>
  updateFundsSortOrder: (updates: Array<{ id: string; sortOrder: number }>) => Promise<void>

  //期货操作
  createFuture: (future: Omit<Future, 'id' | 'createdAt'>) => Promise<Future>
  getFutures: (groupId?: string) => Promise<Future[]>
  updateFuture: (id: string, updates: Partial<Omit<Future, 'id' | 'createdAt'>>) => Promise<void>
  deleteFuture: (id: string) => Promise<void>
  updateFuturesSortOrder: (updates: Array<{ id: string; sortOrder: number }>) => Promise<void>

  //行数据
  getStockQuotes: (symbols: string[]) => Promise<StockQuote[]>
  getFundQuotes: (codes: string[]) => Promise<FundQuote[]>
  getFutureQuotes: (symbols: string[]) => Promise<FutureQuote[]>
  getGlobalIndexQuotes: () => Promise<GlobalIndexQuote[]>
  getGlobalIndexTrend: (symbol: string, period: GlobalTrendPeriod) => Promise<{
    success: boolean
    data?: GlobalIndexTrendData
    error?: string
  }>
  getStockIntraday: (symbol: string) => Promise<{
    success: boolean
    data?: {
      points: Array<{ time: string; price: number; volume: number }>
      yesterdayClose: number
    }
    error?: string
  }>

  // 搜索
  searchStocks: (keyword: string) => Promise<StockSearchResult[]>
  searchFunds: (keyword: string) => Promise<FundSearchResult[]>
  searchFutures: (keyword: string) => Promise<FutureSearchResult[]>
}

// Electron API声明
declare global {
  interface Window {
    electronAPI: {
      db: DatabaseAPI
      platform: string
    }
  }
}