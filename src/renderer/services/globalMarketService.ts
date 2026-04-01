import { GlobalIndexQuote, GlobalIndexTrendData } from '../../shared/types'

class GlobalMarketService {
  async getGlobalIndexQuotes(): Promise<GlobalIndexQuote[]> {
    return window.electronAPI.db.getGlobalIndexQuotes()
  }

  async getGlobalIndexTrendToday(symbol: string): Promise<GlobalIndexTrendData | null> {
    const result = await window.electronAPI.db.getGlobalIndexTrend(symbol, 'today')
    if (!result.success || !result.data) return null
    return result.data
  }
}

export default new GlobalMarketService()

