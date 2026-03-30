import { AlertCircle, CheckCircle2, Clock3, ExternalLink, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { StockNewsArticle } from '../../../shared/types'
import { useNewsStore } from '../../store/newsStore'
import { ArticleReaderModal } from './ArticleReaderModal'

type NewsCategory = 'all' | 'market' | 'geopolitics' | 'economy'

const getCategoryLabel = (category: NewsCategory) => {
  const map: Record<NewsCategory, string> = {
    all: '全部资讯',
    market: '全球股市',
    geopolitics: '地缘政治',
    economy: '经济金融',
  }
  return map[category]
}

const getCategoryColor = (
  category: NewsCategory,
  darkMode: boolean,
): { bg: string; text: string } => {
  const map: Record<NewsCategory, { bg: string; text: string }> = {
    all: { bg: darkMode ? 'bg-gray-700/40' : 'bg-gray-100', text: darkMode ? 'text-gray-300' : 'text-gray-700' },
    market: { bg: darkMode ? 'bg-blue-900/40' : 'bg-blue-100', text: darkMode ? 'text-blue-300' : 'text-blue-700' },
    geopolitics: { bg: darkMode ? 'bg-amber-900/40' : 'bg-amber-100', text: darkMode ? 'text-amber-300' : 'text-amber-700' },
    economy: { bg: darkMode ? 'bg-emerald-900/40' : 'bg-emerald-100', text: darkMode ? 'text-emerald-300' : 'text-emerald-700' },
  }
  return map[category]
}

const detectNewsCategory = (article: StockNewsArticle): NewsCategory => {
  const content = `${article.title} ${article.summary} ${article.source}`.toLowerCase()
  if (/地缘|冲突|战争|制裁|政治|外交|美中|俄罗斯/.test(content)) {
    return 'geopolitics'
  }
  if (/economy|inflation|fed|央行|货币|利率|经济|税收/.test(content)) {
    return 'economy'
  }
  if (/stock|market|nasdaq|sp 500|美股|隔夜|股市|涨跌|指数/.test(content)) {
    return 'market'
  }
  return 'market'
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return '-'

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface SourceHealthTooltipProps {
  darkMode: boolean
  sourceHealth: any | null
  children: React.ReactNode
}

const SourceHealthTooltip: React.FC<SourceHealthTooltipProps> = ({ darkMode, sourceHealth, children }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  if (!sourceHealth) return <>{children}</>

  return (
    <div className="relative inline-block" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      {children}

      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`absolute right-0 top-full z-50 mt-2 min-w-[320px] rounded-lg border shadow-lg ${
            darkMode ? 'border-gray-600 bg-gray-900 text-gray-100' : 'border-gray-300 bg-white text-gray-900'
          }`}
        >
          {/* 标题 */}
          <div className={`border-b px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">数据源状态</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  sourceHealth.isHealthy
                    ? darkMode
                      ? 'bg-emerald-900/30 text-emerald-300'
                      : 'bg-emerald-100 text-emerald-700'
                    : darkMode
                      ? 'bg-red-900/30 text-red-300'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {sourceHealth.availableCount}/{sourceHealth.totalCount} 可用
              </span>
            </div>
          </div>

          {/* 源列表 */}
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(sourceHealth.sources).map(([name, health]: any) => (
              <div
                key={name}
                className={`flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-opacity-50 ${
                  darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                {/* 状态图标 */}
                <div className="flex-shrink-0 pt-0.5">
                  {health.available ? (
                    <Wifi className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <span
                      className={`flex-shrink-0 text-xs px-2 py-0.5 rounded ${
                        health.available
                          ? darkMode
                            ? 'bg-emerald-900/20 text-emerald-300'
                            : 'bg-emerald-100 text-emerald-700'
                          : darkMode
                            ? 'bg-red-900/20 text-red-300'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {health.available ? '正常' : '不可用'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    延迟: {health.latency}ms
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 底部统计 */}
          <div
            className={`px-4 py-2 text-xs ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}
          >
            ✓ {sourceHealth.availableCount} 个源可用 • ✗ {sourceHealth.totalCount - sourceHealth.availableCount} 个源离线
          </div>
        </div>
      )}
    </div>
  )
}

interface NewsViewProps {
  darkMode: boolean
  refreshTrigger: number
}

export const NewsView: React.FC<NewsViewProps> = ({ darkMode, refreshTrigger }) => {
  const {
    categoryData,
    sourceHealth,
    isCheckingSource,
    loadNewsByCategory,
    loadMoreByCategory,
    checkSources,
    clearError,
  } = useNewsStore()

  const [selectedCategory, setSelectedCategory] = React.useState<NewsCategory>('all')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)

  // 首次进入时检查数据源
  useEffect(() => {
    void checkSources()
    void loadNewsByCategory('all')
  }, [])

  // 当切换分类时加载数据
  useEffect(() => {
    void loadNewsByCategory(selectedCategory)
  }, [selectedCategory])

  // 当 refreshTrigger 变化时刷新当前分类
  useEffect(() => {
    void loadNewsByCategory(selectedCategory)
  }, [refreshTrigger])

  // 触底加载更多
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current || loadingMoreRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200

      if (isNearBottom && categoryData[selectedCategory].hasMore && !categoryData[selectedCategory].isLoading) {
        loadingMoreRef.current = true
        void loadMoreByCategory(selectedCategory).finally(() => {
          loadingMoreRef.current = false
        })
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [selectedCategory, categoryData])

  const currentData = categoryData[selectedCategory]
  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'all') {
      return currentData.articles
    }
    return currentData.articles.filter((article) => detectNewsCategory(article) === selectedCategory)
  }, [currentData.articles, selectedCategory])

  const sourceHealthBadge = useMemo(() => {
    if (!sourceHealth) return null
    const availablePercent = Math.round((sourceHealth.availableCount / sourceHealth.totalCount) * 100)
    return {
      available: sourceHealth.isHealthy,
      percent: availablePercent,
      count: `${sourceHealth.availableCount}/${sourceHealth.totalCount}`,
    }
  }, [sourceHealth])

  const [articleModalOpen, setArticleModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<{ title: string; url: string } | null>(null)

  const handleOpenArticle = (article: StockNewsArticle) => {
    setSelectedArticle({ title: article.title, url: article.url })
    setArticleModalOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div
        className={`flex-shrink-0 border-b px-5 py-4 ${
          darkMode ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white/40'
        }`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">实时资讯</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              汇聚全球股市、地缘政治、经济动态，按发布时间倒序展示
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 数据源状态 */}
            {isCheckingSource ? (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="h-2 w-2 animate-spin rounded-full border border-blue-500 border-t-transparent" />
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>检测中...</span>
              </div>
            ) : sourceHealthBadge ? (
              <SourceHealthTooltip darkMode={darkMode} sourceHealth={sourceHealth}>
                <div
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs cursor-pointer transition-all hover:shadow-md ${
                    sourceHealthBadge.available
                      ? darkMode
                        ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/40'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : darkMode
                        ? 'bg-red-900/30 text-red-300 hover:bg-red-900/40'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {sourceHealthBadge.available ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {sourceHealthBadge.available ? '数据源正常' : '数据源异常'} ({sourceHealthBadge.count})
                  </span>
                </div>
              </SourceHealthTooltip>
            ) : null}

            {/* 刷新按钮 */}
            <button
              type="button"
              onClick={() => void loadNewsByCategory(selectedCategory)}
              disabled={currentData.isLoading}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/60'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-blue-100/80'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${currentData.isLoading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'market', 'geopolitics', 'economy'] as NewsCategory[]).map((cat) => {
            const colors = getCategoryColor(cat, darkMode)
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
                  isActive
                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ${darkMode ? 'ring-offset-gray-900' : 'ring-offset-white'}`
                    : `${colors.bg} ${colors.text} hover:shadow-sm`
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-5 py-4"
      >
        <div className="mx-auto max-w-6xl">
          {/* 加载中 - 首次 */}
          {currentData.isLoading && filteredArticles.length === 0 && (
            <div className="py-20 text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>正在拉取最新资讯...</div>
            </div>
          )}

          {/* 错误提示 */}
          {currentData.error && !currentData.isLoading && (
            <div
              className={`rounded-xl border px-5 py-6 text-center ${
                darkMode ? 'border-red-900/60 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-600'
              }`}
            >
              <p className="mb-3">{currentData.error}</p>
              <button
                type="button"
                onClick={() => {
                  clearError(selectedCategory)
                  void loadNewsByCategory(selectedCategory)
                }}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-white text-red-600 hover:bg-red-100'
                }`}
              >
                重试
              </button>
            </div>
          )}

          {/* 空列表 */}
          {!currentData.isLoading && !currentData.error && filteredArticles.length === 0 && (
            <div
              className={`rounded-xl border px-5 py-12 text-center ${
                darkMode ? 'border-gray-700 bg-gray-900/40 text-gray-400' : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              该分类暂无资讯
            </div>
          )}

          {/* 文章列表 */}
          {filteredArticles.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => {
                const category = detectNewsCategory(article)
                const categoryColors = getCategoryColor(category, darkMode)
                return (
                  <article
                    key={article.id}
                    className={`group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                      darkMode
                        ? 'border-gray-700 bg-gray-800/60 hover:border-blue-500/50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    {article.imageUrl && (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="h-40 w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryColors.bg} ${categoryColors.text}`}>
                          {getCategoryLabel(category)}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-base font-semibold leading-6">{article.title}</h3>
                      <p className={`mt-2 line-clamp-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {article.summary || '暂无摘要，点击查看原文。'}
                      </p>

                      <div className={`mt-3 flex items-center justify-between text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="truncate">{article.source}</span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatTime(article.publishedAt)}
                        </span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleOpenArticle(article)}
                          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            darkMode
                              ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          应用内阅读
                        </button>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            darkMode
                              ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          原文链接
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* 加载更多指示 */}
          {currentData.isLoading && filteredArticles.length > 0 && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>加载更多中...</div>
            </div>
          )}

          {/* 没有更多了 */}
          {!currentData.hasMore && filteredArticles.length > 0 && !currentData.isLoading && (
            <div className="py-8 text-center">
              <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>没有更多资讯了</div>
            </div>
          )}
        </div>
      </div>

      {/* 文章阅读模态框 */}
      {selectedArticle && (
        <ArticleReaderModal
          isOpen={articleModalOpen}
          onClose={() => {
            setArticleModalOpen(false)
            setSelectedArticle(null)
          }}
          title={selectedArticle.title}
          url={selectedArticle.url}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}

