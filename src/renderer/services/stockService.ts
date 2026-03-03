import { StockQuote } from '../../shared/types'
import { isValidStockSymbol } from '../../shared/utils'

//服务类
class StockService {
  private static instance: StockService
  private cache: Map<string, { data: StockQuote; timestamp: number }> = new Map()
  private cacheTimeout = 30000 // 30秒缓存

  private constructor() {}

  static getInstance(): StockService {
    if (!StockService.instance) {
      StockService.instance = new StockService()
    }
    return StockService.instance
  }

  //模拟获取股票行情数据（实际项目中需要替换为真实API）
  async getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    //过无效代码
    const validSymbols = symbols.filter(isValidStockSymbol)
    
    if (validSymbols.length === 0) {
      return []
    }

    //检查缓存
    const now = Date.now()
    const uncachedSymbols: string[] = []
    const results: StockQuote[] = []

    validSymbols.forEach(symbol => {
      const cached = this.cache.get(symbol)
      if (cached && (now - cached.timestamp) < this.cacheTimeout) {
        results.push(cached.data)
      } else {
        uncachedSymbols.push(symbol)
      }
    })

    // 获取新数据
    if (uncachedSymbols.length > 0) {
      try {
        const newQuotes = await this.fetchStockData(uncachedSymbols)
        newQuotes.forEach(quote => {
          this.cache.set(quote.symbol, { data: quote, timestamp: now })
          results.push(quote)
        })
      } catch (error) {
        console.error('获取股票数据失败:', error)
        // 返回缓存数据或默认数据
        uncachedSymbols.forEach(symbol => {
          const cached = this.cache.get(symbol)
          if (cached) {
            results.push(cached.data)
          } else {
            // 返回默认数据
            results.push({
              symbol,
              name: `股票${symbol}`,
              price: 0,
              change: 0,
              changePercent: 0,
              updateTime: now
            })
          }
        })
      }
    }

    return results
  }

  //模拟获取股票名称
  async getStockName(symbol: string): Promise<string> {
    if (!isValidStockSymbol(symbol)) {
      throw new Error('无效的股票代码')
    }

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 返回模拟名称
    const names: Record<string, string> = {
      '000001': '平安银行',
      '000002': '万科A',
      '600000': '浦发银行',
      '600036': '招商银行',
      '300015': '爱尔眼科'
    }

    return names[symbol] || `股票${symbol}`
  }

  // 模拟API请求
  private async fetchStockData(symbols: string[]): Promise<StockQuote[]> {
    //模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    // 模拟数据返回
    return symbols.map(symbol => {
      // 生成模拟数据
      const basePrice = Math.random() * 100 + 10
      const change = (Math.random() - 0.5) * 5
      const price = basePrice + change
      const changePercent = change / basePrice

      return {
        symbol,
        name: `股票${symbol}`,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(4)),
        updateTime: Date.now()
      }
    })
  }

  //清理过期缓存
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [symbol, cached] of this.cache.entries()) {
      if ((now - cached.timestamp) > this.cacheTimeout) {
        this.cache.delete(symbol)
      }
    }
  }
}

export default StockService.getInstance()