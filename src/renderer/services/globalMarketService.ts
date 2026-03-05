import { GlobalIndexQuote } from '../../shared/types'

class GlobalMarketService {
  async getGlobalIndexQuotes(): Promise<GlobalIndexQuote[]> {
    return window.electronAPI.db.getGlobalIndexQuotes()
  }
}

export default new GlobalMarketService()

