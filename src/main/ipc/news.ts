import axios from 'axios'
import { ipcMain } from 'electron'
import { StockNewsArticle } from '../../shared/types'

interface NewsSource {
  name: string
  url: string
}

const NEWS_SOURCES: NewsSource[] = [
  {
    name: '国内股市 - Google',
    url: 'https://news.google.com/rss/search?q=A%E8%82%A1%20OR%20%E4%B8%8A%E8%AF%81%E6%8C%87%E6%95%B0%20OR%20%E6%B7%B1%E8%AF%81%E6%88%90%E6%8C%87%20when%3A1d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    name: '全球股市 - Google',
    url: 'https://news.google.com/rss/search?q=stock%20market%20OR%20nasdaq%20OR%20s%26p%20500%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Yahoo Finance',
    url: 'https://finance.yahoo.com/news/rssindex',
  },
  {
    name: 'CNN 国际 - 时事',
    url: 'http://rss.cnn.com/rss/cnn_world.rss',
  },
  {
    name: 'BBC 商业',
    url: 'http://feeds.bbc.co.uk/news/business/rss.xml',
  },
  {
    name: 'Reuters 美国商业',
    url: 'https://feeds.reuters.com/reuters/businessNews',
  },
  {
    name: 'CNBC 美股',
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
  },
  {
    name: 'MarketWatch 最新消息',
    url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
  },
  {
    name: '地缘政治 - Google',
    url: 'https://news.google.com/rss/search?q=%E5%9C%B0%E7%BC%98%20OR%20%E5%86%B2%E7%AA%81%20OR%20%E6%94%BF%E6%B2%BB%20when%3A1d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    name: 'Google 经济政策',
    url: 'https://news.google.com/rss/search?q=economy%20OR%20inflation%20OR%20fed%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
  },
]

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

const decodeHtmlEntities = (raw: string) => {
  return String(raw || '').replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_match, entity) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const codePoint = parseInt(entity.slice(2), 16)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : ''
    }
    if (entity.startsWith('#')) {
      const codePoint = parseInt(entity.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : ''
    }
    return HTML_ENTITY_MAP[entity] || ''
  })
}

const stripHtml = (raw: string) => {
  return decodeHtmlEntities(String(raw || '').replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1'))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const extractTag = (xml: string, tagName: string) => {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i'))
  return match?.[1]?.trim() || ''
}

const extractImageUrl = (itemXml: string) => {
  const mediaMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*>/i)
  if (mediaMatch?.[1]) return mediaMatch[1]

  const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i)
  if (enclosureMatch?.[1]) return enclosureMatch[1]

  const imgMatch = itemXml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
  if (imgMatch?.[1]) return imgMatch[1]

  return ''
}

const parseRssItems = (xml: string, sourceName: string): StockNewsArticle[] => {
  const normalizedXml = String(xml || '')
  const itemBlocks = normalizedXml.match(/<item\b[\s\S]*?<\/item>/gi) || []
  type ParsedNewsItem = StockNewsArticle | null

  const parsedItems: ParsedNewsItem[] = itemBlocks
    .map((itemXml) => {
      const title = stripHtml(extractTag(itemXml, 'title'))
      const link = decodeHtmlEntities(stripHtml(extractTag(itemXml, 'link')))
      const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded')
      const summary = stripHtml(description).slice(0, 220)
      const source = stripHtml(extractTag(itemXml, 'source')) || sourceName
      const pubDateRaw = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date')
      const publishedAt = Date.parse(pubDateRaw)
      const imageUrl = extractImageUrl(itemXml)

      if (!title || !link) return null

      return {
        id: `${link}::${title}`,
        title,
        summary,
        url: link,
        source,
        publishedAt: Number.isFinite(publishedAt) ? publishedAt : Date.now(),
        ...(imageUrl ? { imageUrl } : {}),
      }
    })

  return parsedItems.filter((item): item is StockNewsArticle => item !== null)
}

const fetchSourceNews = async (source: NewsSource): Promise<StockNewsArticle[]> => {
  const response = await axios.get(source.url, {
    timeout: 12000,
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    responseType: 'text',
  })

  return parseRssItems(response.data, source.name)
}

export function registerStockNewsHandlers() {
  ipcMain.handle('db-get-stock-news', async (_event, limit: number = 30) => {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 100) : 30

    const results = await Promise.allSettled(NEWS_SOURCES.map(fetchSourceNews))
    const aggregated: StockNewsArticle[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        aggregated.push(...result.value)
      } else {
        console.warn(`Stock news source failed: ${NEWS_SOURCES[index].name}`, result.reason)
      }
    })

    const dedup = new Map<string, StockNewsArticle>()
    aggregated
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .forEach((article) => {
        const key = `${article.url}::${article.title}`.toLowerCase()
        if (!dedup.has(key)) {
          dedup.set(key, article)
        }
      })

    return Array.from(dedup.values()).slice(0, safeLimit)
  })

  ipcMain.handle('db-check-news-sources', async () => {
    const sourceHealth: Record<string, { name: string; available: boolean; latency: number }> = {}

    await Promise.allSettled(
      NEWS_SOURCES.map(async (source) => {
        const startTime = Date.now()
        try {
          const response = await axios.get(source.url, {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0',
              Accept: 'application/rss+xml, application/xml, text/xml, */*',
            },
            responseType: 'text',
          })

          const latency = Date.now() - startTime
          const available = response.status === 200 && (response.data?.length ?? 0) > 100

          sourceHealth[source.name] = {
            name: source.name,
            available,
            latency,
          }
        } catch (error) {
          sourceHealth[source.name] = {
            name: source.name,
            available: false,
            latency: Date.now() - startTime,
          }
        }
      }),
    )

    const availableCount = Object.values(sourceHealth).filter((s) => s.available).length
    return {
      sources: sourceHealth,
      availableCount,
      totalCount: NEWS_SOURCES.length,
      isHealthy: availableCount >= Math.ceil(NEWS_SOURCES.length * 0.5),
    }
  })

  ipcMain.handle('db-get-article-content', async (_event, url: string) => {
    if (!url || !url.startsWith('http')) {
      return { success: false, error: '无效的文章链接' }
    }

    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        responseType: 'text',
      })

      const html = response.data

      // 尝试提取文章内容的多个策略
      const strategies = [
        // 策略1: 寻找 article 标签
        () => html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1],
        // 策略2: 寻找 main 标签
        () => html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1],
        // 策略3: 寻找 content/article-content 类名
        () => html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1],
        // 策略4: 寻找 body 标签
        () => html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1],
      ]

      let contentHtml = null
      for (const strategy of strategies) {
        contentHtml = strategy()
        if (contentHtml && contentHtml.length > 500) break
      }

      if (!contentHtml) {
        return { success: false, error: '无法提取文章内容，请在浏览器中打开阅读' }
      }

      // 清理 HTML：移除脚本、样式、广告等
      const cleaned = contentHtml
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[\s\S]*?<\/style>/gi, '')
        .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '')
        .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+data-ad[^>]*>/gi, '')
        .replace(/<[^>]+class="[^"]*ad[^"]*"[^>]*>/gi, '')

      return {
        success: true,
        data: {
          html: cleaned,
          contentLength: cleaned.length,
        },
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '获取文章内容失败'
      return { success: false, error: errorMsg }
    }
  })
}

