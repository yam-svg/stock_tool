import { Stock, Fund, PositionProfit } from './types'

//股票收益计算
export function calculateStockProfit(stock: Stock, currentPrice: number): PositionProfit {
  const cost = stock.costPrice * stock.quantity
  const marketValue = currentPrice * stock.quantity
  const profit = marketValue - cost
  const profitRate = cost !== 0 ? profit / cost : 0
  
  return {
    cost,
    marketValue,
    profit,
    profitRate
  }
}

//基金收益计算
export function calculateFundProfit(fund: Fund, currentNav: number): PositionProfit {
  const cost = fund.costNav * fund.shares
  const marketValue = currentNav * fund.shares
  const profit = marketValue - cost
  const profitRate = cost !== 0 ? profit / cost : 0
  
  return {
    cost,
    marketValue,
    profit,
    profitRate
  }
}

//分组收益汇总计算
export function calculateGroupProfit(
  positions: Array<{ profit: PositionProfit }>,
): PositionProfit {
  const totalCost = positions.reduce((sum, pos) => sum + pos.profit.cost, 0)
  const totalMarketValue = positions.reduce((sum, pos) => sum + pos.profit.marketValue, 0)
  const totalProfit = totalMarketValue - totalCost
  const totalProfitRate = totalCost !== 0 ? totalProfit / totalCost : 0
  
  return {
    cost: totalCost,
    marketValue: totalMarketValue,
    profit: totalProfit,
    profitRate: totalProfitRate
  }
}

//格化百分比显示
export function formatPercent(rate: number): string {
  if (isNaN(rate) || !isFinite(rate)) return '0.00%'
  return `${(rate * 100).toFixed(2)}%`
}

// 格式化金额显示
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '0.00'
  return amount.toFixed(2)
}

// 格式化时间显示
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

//验证股票代码格式
export function isValidStockSymbol(symbol: string): boolean {
  //支持A股代码格式（如：000001, 600000, 300001等）或带前缀的格式（如：sh600519, sz000001）
  return /^[0-9]{6}$/.test(symbol) || /^(sh|sz|hk|us)[0-9a-zA-Z.]+$/.test(symbol.toLowerCase())
}

//验证基金代码格式
export function isValidFundCode(code: string): boolean {
  //支持基金代码格式
  return /^[0-9]{6}$/.test(code)
}