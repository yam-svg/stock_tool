import { StockNewsArticle, NewsSourceCheckResult, ArticleContent } from '../../shared/types'

class NewsService {
  async getStockNews(limit = 30): Promise<StockNewsArticle[]> {
    return window.electronAPI.db.getStockNews(limit)
  }

  async checkNewsSources(): Promise<NewsSourceCheckResult> {
    return window.electronAPI.db.checkNewsSources()
  }

  async getArticleContent(url: string): Promise<{ success: boolean; data?: ArticleContent; error?: string }> {
    return window.electronAPI.db.getArticleContent(url)
  }
}

export default new NewsService()

