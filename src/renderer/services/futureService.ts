import { FutureQuote, FutureSearchResult } from '../../shared/types'

class FutureService {
  private static instance: FutureService
  private cache: Map<string, { data: FutureQuote; timestamp: number }> = new Map()
  private cacheTimeout = 15000

  private constructor() {}

  static getInstance(): FutureService {
    if (!FutureService.instance) {
      FutureService.instance = new FutureService()
    }
    return FutureService.instance
  }

  async getFutureQuotes(symbols: string[]): Promise<FutureQuote[]> {
    if (symbols.length === 0) return []

    const now = Date.now()
    const uncached: string[] = []
    const results: FutureQuote[] = []

    symbols.forEach((symbol) => {
      const cached = this.cache.get(symbol)
      if (cached && now - cached.timestamp < this.cacheTimeout) {
        results.push(cached.data)
      } else {
        uncached.push(symbol)
      }
    })

    if (uncached.length > 0) {
      try {
        const fetched = await window.electronAPI.db.getFutureQuotes(uncached)
        fetched.forEach((quote) => {
          this.cache.set(quote.symbol, { data: quote, timestamp: now })
          results.push(quote)
        })
      } catch (error) {
        console.error('获取期货数据失败:', error)
      }
    }

    return results
  }

  async searchFutures(keyword: string): Promise<FutureSearchResult[]> {
    if (!keyword.trim()) return []
    return window.electronAPI.db.searchFutures(keyword)
  }
}

export default FutureService.getInstance()

