import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { StockNewsArticle, NewsSourceCheckResult } from '../../shared/types'
import NewsService from '../services/newsService'

type NewsCategory = 'all' | 'market' | 'geopolitics' | 'economy'

interface NewsCategoryData {
  articles: StockNewsArticle[]
  hasMore: boolean
  isLoading: boolean
  error: string | null
}

interface NewsState {
  // 各分类数据
  categoryData: Record<NewsCategory, NewsCategoryData>
  
  // 全局数据
  allArticles: StockNewsArticle[]
  sourceHealth: NewsSourceCheckResult | null
  isCheckingSource: boolean
  
  // 操作
  loadNewsByCategory: (category: NewsCategory, limit?: number) => Promise<void>
  loadMoreByCategory: (category: NewsCategory, limit?: number) => Promise<void>
  checkSources: () => Promise<void>
  clearError: (category: NewsCategory) => void
}

const initializeCategoryData = (): Record<NewsCategory, NewsCategoryData> => ({
  all: { articles: [], hasMore: true, isLoading: false, error: null },
  market: { articles: [], hasMore: true, isLoading: false, error: null },
  geopolitics: { articles: [], hasMore: true, isLoading: false, error: null },
  economy: { articles: [], hasMore: true, isLoading: false, error: null },
})

export const useNewsStore = create<NewsState>()(
  devtools(
    (set, get) => ({
      categoryData: initializeCategoryData(),
      allArticles: [],
      sourceHealth: null,
      isCheckingSource: false,

      loadNewsByCategory: async (category: NewsCategory, limit = 40) => {
        set((state) => ({
          categoryData: {
            ...state.categoryData,
            [category]: { ...state.categoryData[category], isLoading: true, error: null },
          },
        }))

        try {
          const articles = await NewsService.getStockNews(limit)
          
          set((state) => {
            const allArticles = category === 'all' ? articles : state.allArticles
            
            return {
              allArticles,
              categoryData: {
                ...state.categoryData,
                [category]: {
                  articles,
                  hasMore: articles.length >= limit,
                  isLoading: false,
                  error: null,
                },
              },
            }
          })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : '加载资讯失败'
          set((state) => ({
            categoryData: {
              ...state.categoryData,
              [category]: {
                ...state.categoryData[category],
                isLoading: false,
                error: errorMsg,
              },
            },
          }))
        }
      },

      loadMoreByCategory: async (category: NewsCategory, limit = 20) => {
        const currentData = get().categoryData[category]
        if (!currentData.hasMore || currentData.isLoading) return

        set((state) => ({
          categoryData: {
            ...state.categoryData,
            [category]: { ...currentData, isLoading: true },
          },
        }))

        try {
          // 从后端获取更多数据（简单方案：重新获取所有数据并取更多）
          const allArticles = await NewsService.getStockNews(
            currentData.articles.length + limit,
          )

          set((state) => ({
            categoryData: {
              ...state.categoryData,
              [category]: {
                articles: allArticles,
                hasMore: allArticles.length > currentData.articles.length,
                isLoading: false,
                error: null,
              },
            },
          }))
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : '加载更多资讯失败'
          set((state) => ({
            categoryData: {
              ...state.categoryData,
              [category]: {
                ...currentData,
                isLoading: false,
                error: errorMsg,
              },
            },
          }))
        }
      },

      checkSources: async () => {
        set({ isCheckingSource: true })
        try {
          const health = await NewsService.checkNewsSources()
          set({ sourceHealth: health, isCheckingSource: false })
        } catch (err) {
          console.error('Check sources failed:', err)
          set({ isCheckingSource: false })
        }
      },

      clearError: (category: NewsCategory) => {
        set((state) => ({
          categoryData: {
            ...state.categoryData,
            [category]: {
              ...state.categoryData[category],
              error: null,
            },
          },
        }))
      },
    }),
    { name: 'news-store' },
  ),
)

