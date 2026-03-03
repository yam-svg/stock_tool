import { StockQuote, StockSearchResult } from '../../shared/types'

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

  // 搜索股票（调用主进程接口）
  async searchStocks(keyword: string): Promise<StockSearchResult[]> {
    if (!keyword.trim()) return []
    return window.electronAPI.db.searchStocks(keyword)
  }

  //获取股票行情数据（调用主进程接口）
  async getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (symbols.length === 0) return []

    //检查缓存
    const now = Date.now()
    const uncachedSymbols: string[] = []
    const results: StockQuote[] = []

    symbols.forEach(symbol => {
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
        const newQuotes = await window.electronAPI.db.getStockQuotes(uncachedSymbols)
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