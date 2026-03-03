import { FundQuote } from '../../shared/types'
import { isValidFundCode } from '../../shared/utils'

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

  // 获取基金行情数据（通过第三方接口）
  async getFundQuotes(codes: string[]): Promise<FundQuote[]> {
    if (codes.length === 0) {
      return []
    }

    //过滤无效代码
    const validCodes = codes.filter(isValidFundCode)
    const invalidCodes = codes.filter(c => !isValidFundCode(c))
    
    //检查缓存
    const now = Date.now()
    const uncachedCodes: string[] = []
    const results: FundQuote[] = []

    // 处理无效代码，给默认值
    invalidCodes.forEach(code => {
      results.push({
        code,
        name: `基金${code}`,
        nav: 0,
        change: 0,
        changePercent: 0,
        date: new Date().toISOString().split('T')[0]
      })
    })

    validCodes.forEach(code => {
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
        const newQuotes = await this.fetchFundData(uncachedCodes)
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
            // 返回默认数据
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

  // 获取基金基本信息
  async getFundInfo(code: string): Promise<{ name: string; nav: number; date: string }> {
    if (!isValidFundCode(code)) {
      throw new Error('无效的基金代码')
    }

    //检查缓存
    const cached = this.cache.get(code)
    if (cached) {
      return {
        name: cached.data.name,
        nav: cached.data.nav,
        date: cached.data.date
      }
    }

    // 获取数据
    try {
      const quotes = await this.fetchFundData([code])
      if (quotes.length > 0) {
        const quote = quotes[0]
        this.cache.set(code, { 
          data: quote, 
          timestamp: Date.now() 
        })
        return {
          name: quote.name,
          nav: quote.nav,
          date: quote.date
        }
      }
    } catch (error) {
      console.error('获取基金信息失败:', error)
    }

    // 返回默认数据
    return {
      name: `基金${code}`,
      nav: 1.0,
      date: new Date().toISOString().split('T')[0]
    }
  }

  // 模拟基金数据获取（实际项目中需要调用第三方API）
  private async fetchFundData(codes: string[]): Promise<FundQuote[]> {
    //模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟基金API数据
    const mockData: Record<string, FundQuote> = {
      '000001': {
        code: '000001',
        name: '华夏成长混合',
        nav: 1.2356,
        change: 0.0125,
        changePercent: 0.0102,
        date: new Date().toISOString().split('T')[0]
      },
      '161725': {
        code: '161725',
        name: '招商白酒指数',
        nav: 0.9843,
        change: -0.0215,
        changePercent: -0.0213,
        date: new Date().toISOString().split('T')[0]
      },
      '110022': {
        code: '110022',
        name: '易方达消费行业',
        nav: 2.4567,
        change: 0.0321,
        changePercent: 0.0132,
        date: new Date().toISOString().split('T')[0]
      }
    }

    const results: FundQuote[] = []
    codes.forEach(code => {
      if (mockData[code]) {
        results.push({ ...mockData[code] })
      } else {
        //生成随机数据
        const baseNav = Math.random() * 2 + 0.5
        const change = (Math.random() - 0.5) * 0.1
        const nav = baseNav + change
        const changePercent = change / baseNav

        results.push({
          code,
          name: `基金${code}`,
          nav: Number(nav.toFixed(4)),
          change: Number(change.toFixed(4)),
          changePercent: Number(changePercent.toFixed(4)),
          date: new Date().toISOString().split('T')[0]
        })
      }
    })

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