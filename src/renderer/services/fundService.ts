import { FundQuote } from '../../shared/types'

//基金服务类
class FundService {
  private static instance: FundService
  private cache: Map<string, { data: FundQuote; timestamp: number }> = new Map()
  private cacheTimeout = 300000 // 5分钟缓存

  private constructor() {}

  static getInstance(): FundService {
    if (!FundService.instance) {
      FundService.instance = new FundService()
    }
    return FundService.instance
  }

  // 获取基金行情数据（调用主进程接口）
  async getFundQuotes(codes: string[]): Promise<FundQuote[]> {
    if (codes.length === 0) return []

    //检查缓存
    const now = Date.now()
    const uncachedCodes: string[] = []
    const results: FundQuote[] = []

    codes.forEach(code => {
      const cached = this.cache.get(code)
      if (cached && (now - cached.timestamp) < this.cacheTimeout) {
        results.push(cached.data)
      } else {
        uncachedCodes.push(code)
      }
    })

    // 获取新数据
    if (uncachedCodes.length > 0) {
      try {
        const newQuotes = await window.electronAPI.db.getFundQuotes(uncachedCodes)
        newQuotes.forEach(quote => {
          this.cache.set(quote.code, { data: quote, timestamp: now })
          results.push(quote)
        })
      } catch (error) {
        console.error('获取基金数据失败:', error)
        // 返回缓存数据或默认数据
        uncachedCodes.forEach(code => {
          const cached = this.cache.get(code)
          if (cached) {
            results.push(cached.data)
          } else {
            results.push({
              code,
              name: `基金${code}`,
              nav: 0,
              change: 0,
              changePercent: 0,
              date: new Date().toISOString().split('T')[0]
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
    for (const [code, cached] of this.cache.entries()) {
      if ((now - cached.timestamp) > this.cacheTimeout) {
        this.cache.delete(code)
      }
    }
  }
}

export default FundService.getInstance()