import axios from 'axios'
import { ipcMain } from 'electron'
import iconv from 'iconv-lite'
import { GlobalTrendPeriod } from '../../shared/types'
import { isMarketOpenByTimezone, parseSinaData } from '../utils'
import { GLOBAL_INDEXES, SINA_SYMBOL_MAP } from '../utils/constants'

const GLOBAL_TREND_PERIOD_CONFIG: Record<GlobalTrendPeriod, { interval: string; range: string }> = {
  today: { interval: '1m', range: '5d' },
  history: { interval: '1d', range: '5y' },
}

const globalPreviousCloseCache = new Map<string, { value: number; timestamp: number }>()
const GLOBAL_PREVIOUS_CLOSE_CACHE_TTL = 60 * 1000

const fetchUnifiedPreviousClose = async (symbol: string) => {
  const cached = globalPreviousCloseCache.get(symbol)
  const now = Date.now()
  if (cached && now - cached.timestamp < GLOBAL_PREVIOUS_CLOSE_CACHE_TTL) {
    return cached.value
  }

  const encodedSymbol = encodeURIComponent(symbol)
  const response = await axios.get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1d&range=10d`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 10000,
    },
  )

  const result = response.data?.chart?.result?.[0]
  const closes = (result?.indicators?.quote?.[0]?.close as Array<number | null> | undefined) || []
  const validCloses = closes.filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0)

  // Use the last two daily closes as the canonical previous-close source.
  // Yahoo meta.chartPreviousClose may vary by query range and cause drift.
  let previousClose = validCloses.length >= 2 ? validCloses[validCloses.length - 2] : NaN
  if (!Number.isFinite(previousClose) || previousClose <= 0) {
    previousClose = validCloses.length === 1 ? validCloses[0] : NaN
  }
  if (!Number.isFinite(previousClose) || previousClose <= 0) {
    previousClose = Number(result?.meta?.regularMarketPreviousClose)
  }
  if (!Number.isFinite(previousClose) || previousClose <= 0) {
    previousClose = Number(result?.meta?.chartPreviousClose)
  }

  if (!Number.isFinite(previousClose) || previousClose <= 0) {
    throw new Error('No valid previous close from unified source')
  }

  const normalizedValue = Number(previousClose.toFixed(4))
  globalPreviousCloseCache.set(symbol, { value: normalizedValue, timestamp: now })
  return normalizedValue
}

const fetchCnIndexTodayTrendFromSina = async (symbol: string) => {
  const sinaSymbol = SINA_SYMBOL_MAP[symbol]
  if (!sinaSymbol || (!sinaSymbol.startsWith('sh') && !sinaSymbol.startsWith('sz'))) {
    return null
  }

  const baseResponse = await axios.get(`http://hq.sinajs.cn/list=${sinaSymbol}`, {
    headers: {
      Referer: 'https://finance.sina.com.cn',
      'User-Agent': 'Mozilla/5.0',
    },
    responseType: 'arraybuffer',
    timeout: 10000,
  })
  const baseText = iconv.decode(baseResponse.data, 'gbk')
  const baseMatch = baseText.match(/var hq_str_[^=]+="([^"]*)"/)
  const baseFields = baseMatch ? baseMatch[1].split(',') : []
  const previousClose = Number(baseFields[2]) || 0

  const trendResponse = await axios.get(
    `https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData?symbol=${sinaSymbol}&scale=1&ma=no&datalen=1024`,
    {
      headers: {
        Referer: 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 10000,
    },
  )

  const rows = Array.isArray(trendResponse.data) ? trendResponse.data : []
  const normalizedRows = rows
    .map((row: any) => {
      const dateTime = String(row?.day || '').trim()
      const close = Number(row?.close)
      const open = Number(row?.open)
      const high = Number(row?.high)
      const low = Number(row?.low)
      if (!dateTime || !Number.isFinite(close) || close <= 0) return null
      const ts = new Date(dateTime).getTime()
      if (!Number.isFinite(ts) || ts <= 0) return null

      return {
        ts,
        dateKey: dateTime.split(' ')[0] || '',
        close,
        open: Number.isFinite(open) && open > 0 ? open : close,
        high: Number.isFinite(high) && high > 0 ? high : close,
        low: Number.isFinite(low) && low > 0 ? low : close,
      }
    })
    .filter((item): item is { ts: number; dateKey: string; close: number; open: number; high: number; low: number } => item !== null)

  if (normalizedRows.length === 0) return null

  const latestDateKey = normalizedRows[normalizedRows.length - 1].dateKey
  const points = normalizedRows
    .filter((row) => row.dateKey === latestDateKey)
    .map((row) => {
      const dt = new Date(row.ts)
      return {
        timestamp: row.ts,
        value: Number(row.close.toFixed(4)),
        label: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
        open: Number(row.open.toFixed(4)),
        high: Number(row.high.toFixed(4)),
        low: Number(row.low.toFixed(4)),
        close: Number(row.close.toFixed(4)),
      }
    })

  if (points.length === 0) return null

  return {
    points,
    previousClose: previousClose > 0 ? previousClose : points[0].open,
  }
}

/**
 * 注册 IPC：获取全球指数行情
 */
export async function registerGlobalIndexQuoteHandlers() {
  const yahooSymbolMap: Record<string, string> = {
    '^N225': '^N225',
    '^KS11': '^KS11',
    '^HSI': '^HSI',
    '^HSTECH': '^HSTECH',
  }

  const fetchYahooIndexQuote = async (symbol: string) => {
    const yahooSymbol = yahooSymbolMap[symbol]
    if (!yahooSymbol) return null

    const encodedSymbol = encodeURIComponent(yahooSymbol)
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1d&range=7d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        timeout: 10000,
      },
    )

    const result = response.data?.chart?.result?.[0]
    const closes = (result?.indicators?.quote?.[0]?.close as Array<number | null> | undefined) || []
    const validCloses = closes.filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0)
    if (validCloses.length === 0) return null

    const price = validCloses[validCloses.length - 1]
    const prevClose = validCloses.length >= 2 ? validCloses[validCloses.length - 2] : price
    const changePercent = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0

    return {
      price,
      changePercent,
    }
  }

  ipcMain.handle("db-get-global-index-quotes", async () => {
    const symbols = Object.values(SINA_SYMBOL_MAP).join(",")
    const sinaUrl = `http://hq.sinajs.cn/list=${symbols}`
    const now = Date.now()
    const quoteMap = new Map<string, { price: number; changePercent: number }>()
    
    // 1️⃣ 新浪接口
    try {
      const res = await axios.get(sinaUrl, {
        responseType: "arraybuffer",
        headers: {
          Referer: "https://finance.sina.com.cn",
          "User-Agent": "Mozilla/5.0",
        },
        timeout: 10000,
      })
      const text = iconv.decode(res.data, "gbk")
      const sinaQuotes = parseSinaData(text)
      sinaQuotes.forEach((v, k) => quoteMap.set(k, v))
    } catch (err) {
      console.warn("新浪接口获取失败", err)
    }
    
    // 2️⃣ 对新浪无返回或未配置新浪映射的指数做 Yahoo 兜底（覆盖日经225、韩国综合指数）
    for (const item of GLOBAL_INDEXES) {
      const sinaSymbol = SINA_SYMBOL_MAP[item.symbol]
      if (sinaSymbol && quoteMap.has(sinaSymbol)) continue

      try {
        const yahooQuote = await fetchYahooIndexQuote(item.symbol)
        if (yahooQuote) {
          quoteMap.set(item.symbol, yahooQuote)
        }
      } catch (err) {
        console.warn(`Yahoo 兜底接口失败 (${item.symbol})`, err)
      }
    }
    
    // 3️⃣ 构建统一返回结果
    return GLOBAL_INDEXES.map((item) => {
      const sinaSymbol = SINA_SYMBOL_MAP[item.symbol]
      const quote = (sinaSymbol ? quoteMap.get(sinaSymbol) : undefined) || quoteMap.get(item.symbol)
      
      return {
        symbol: item.symbol,
        code: item.code,
        name: `${item.nameCn} (${item.nameEn})`,
        market: item.market,
        value: quote?.price || 0,
        changePercent: quote?.changePercent || 0,
        isOpen: isMarketOpenByTimezone(item.market, item.timezone),
        updateTime: now,
      }
    })
  })
}

/**
 * 获取全球指数走势数据
 */
export function registerGlobalIndexTrendHandler() {
  ipcMain.handle('db-get-global-index-trend', async (_event, rawSymbol: string, rawPeriod: GlobalTrendPeriod) => {
    const symbol = String(rawSymbol || '').trim()
    const period = (rawPeriod || 'today') as GlobalTrendPeriod

    if (!symbol) {
      return { success: false, error: '指数代码不能为空' }
    }

    if (!GLOBAL_TREND_PERIOD_CONFIG[period]) {
      return { success: false, error: '不支持的走势周期' }
    }

    try {
      if (period === 'today') {
        try {
          const cnTodayData = await fetchCnIndexTodayTrendFromSina(symbol)
          if (cnTodayData) {
            const indexInfo = GLOBAL_INDEXES.find((item) => item.symbol === symbol)
            return {
              success: true,
              data: {
                symbol,
                name: indexInfo ? `${indexInfo.nameCn} (${indexInfo.nameEn})` : symbol,
                period,
                points: cnTodayData.points,
                previousClose: Number(cnTodayData.previousClose.toFixed(4)),
              },
            }
          }
        } catch (error) {
          console.warn(`Sina today trend fallback to Yahoo for ${symbol}:`, error)
        }
      }

      const { interval, range } = GLOBAL_TREND_PERIOD_CONFIG[period]
      const encodedSymbol = encodeURIComponent(symbol)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=${interval}&range=${range}`
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        timeout: 12000,
      })

      const result = response.data?.chart?.result?.[0]
      const timestamps = (result?.timestamp as number[] | undefined) || []
      const opens = (result?.indicators?.quote?.[0]?.open as Array<number | null> | undefined) || []
      const highs = (result?.indicators?.quote?.[0]?.high as Array<number | null> | undefined) || []
      const lows = (result?.indicators?.quote?.[0]?.low as Array<number | null> | undefined) || []
      const closes = (result?.indicators?.quote?.[0]?.close as Array<number | null> | undefined) || []
      const gmtOffsetSeconds = Number(result?.meta?.gmtoffset) || 0

      const toExchangeDateKey = (timestampSeconds: number) => {
        const exchangeDate = new Date((timestampSeconds + gmtOffsetSeconds) * 1000)
        const year = exchangeDate.getUTCFullYear()
        const month = String(exchangeDate.getUTCMonth() + 1).padStart(2, '0')
        const day = String(exchangeDate.getUTCDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      let sourcePoints = timestamps
        .map((timestamp, index) => {
          const open = opens[index]
          const high = highs[index]
          const low = lows[index]
          const close = closes[index]
          if (!Number.isFinite(close) || (close as number) <= 0) return null

          const normalizedOpen = Number.isFinite(open) && (open as number) > 0 ? Number(open) : Number(close)
          const normalizedHigh = Number.isFinite(high) && (high as number) > 0 ? Number(high) : Number(close)
          const normalizedLow = Number.isFinite(low) && (low as number) > 0 ? Number(low) : Number(close)
          const normalizedClose = Number(close)

          return {
            timestampSeconds: timestamp,
            value: Number((close as number).toFixed(4)),
            open: Number(normalizedOpen.toFixed(4)),
            high: Number(Math.max(normalizedHigh, normalizedOpen, normalizedClose).toFixed(4)),
            low: Number(Math.min(normalizedLow, normalizedOpen, normalizedClose).toFixed(4)),
            close: Number(normalizedClose.toFixed(4)),
          }
        })
        .filter((item): item is { timestampSeconds: number; value: number; open: number; high: number; low: number; close: number } => item !== null)

      if (period === 'today' && sourcePoints.length > 0) {
        const latestDateKey = toExchangeDateKey(sourcePoints[sourcePoints.length - 1].timestampSeconds)
        sourcePoints = sourcePoints.filter((item) => toExchangeDateKey(item.timestampSeconds) === latestDateKey)
      }

      const points = sourcePoints.map((item) => {
        const time = new Date(item.timestampSeconds * 1000)
        const label =
          period === 'today'
            ? `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
            : `${time.getMonth() + 1}/${time.getDate()}`

        return {
          timestamp: item.timestampSeconds * 1000,
          value: item.value,
          label,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }
      })

      if (points.length === 0) {
        return { success: false, error: '该指数暂无可用走势数据' }
      }

      let previousClose: number
      try {
        previousClose = await fetchUnifiedPreviousClose(symbol)
      } catch (error) {
        const regularPreviousClose = Number(result?.meta?.regularMarketPreviousClose)
        const chartPreviousClose = Number(result?.meta?.chartPreviousClose)
        previousClose = Number.isFinite(regularPreviousClose) && regularPreviousClose > 0
          ? regularPreviousClose
          : Number.isFinite(chartPreviousClose) && chartPreviousClose > 0
            ? chartPreviousClose
            : points.length > 1
              ? points[points.length - 2].value
              : points[points.length - 1].value
        console.warn(`Fallback previous close for ${symbol}:`, error)
      }

      const indexInfo = GLOBAL_INDEXES.find((item) => item.symbol === symbol)

      return {
        success: true,
        data: {
          symbol,
          name: indexInfo ? `${indexInfo.nameCn} (${indexInfo.nameEn})` : symbol,
          period,
          points,
          previousClose: Number(previousClose.toFixed(4)),
        },
      }
    } catch (error) {
      console.error('Fetch global index trend failed:', error)
      return {
        success: false,
        error: '获取全球指数走势失败',
      }
    }
  })
}

/**
 * 获取股票行情数据
 */
export function registerStockQuoteHandlers() {
  ipcMain.handle('db-get-stock-quotes', async (_event, symbols: string[]) => {
    if (symbols.length === 0) return []
    
    try {
      const fullSymbols = symbols.map(s => {
        // 如果已经有前缀则保持原样
        if (/^[a-z]{2}[0-9]+/.test(s)) return s.toLowerCase()
        // 否则根据数字开头猜测
        if (/^[0-9]{6}$/.test(s)) {
          if (s.startsWith('6') || s.startsWith('5')) return `sh${s}`
          if (s.startsWith('0') || s.startsWith('3') || s.startsWith('1')) return `sz${s}`
        }
        return s.toLowerCase()
      })
      
      const q = fullSymbols.join(',')
      const response = await axios.get(`http://hq.sinajs.cn/list=${q}`, {
        headers: {
          Referer: 'http://finance.sina.com.cn',
        },
        responseType: 'arraybuffer',
      })
      
      const decoder = new TextDecoder('gbk')
      const text = decoder.decode(response.data)
      const lines = text.split('\n').filter(line => line.trim())
      
      return lines
        .map(line => {
          // var hq_str_sh600519="贵州茅台,1710.00,1711.00,1710.00,1715.00,1700.00,1710.00,1710.05,..."
          const match = line.match(/var hq_str_([^=]+)="([^"]+)"/)
          if (!match) return null
          
          const symbol = match[1]
          const data = match[2].split(',')
          if (data.length < 4) return null
          
          const name = data[0]
          const preClose = parseFloat(data[2])
          const price = parseFloat(data[3])
          
          const change = price !== 0 ? price - preClose : 0
          const changePercent = preClose !== 0 ? (change / preClose) * 100 : 0
          
          return {
            symbol,
            name,
            price: price || preClose || 0,
            change,
            changePercent,
            updateTime: Date.now(),
          }
        })
        .filter(quote => quote !== null)
    } catch (error) {
      console.error('Fetch stock quotes failed:', error)
      return []
    }
  })
}

/**
 * 获取基金行情数据 - 使用多重备用接口方案 (东方财富 + 新浪 + 网易)
 * 特别优化了QDII基金的数据获取
 */
export function registerFundQuoteHandlers() {
  // 本地缓存，减少频繁调用接口
  const fundCache = new Map<string, { data: any; timestamp: number }>()
  const CACHE_TTL = 60000 // 1分钟缓存
  const QDII_CACHE_TTL = 30000 // QDII基金30秒缓存（更激进的更新）
  const KNOWN_QDII_CODES = new Set(['017437'])
  
  // 仅对已确认的代码做“预判QDII”，避免把普通基金误分到QDII通道。
  // 其他QDII交给后续“按名称识别”阶段处理。
  const qdiiPatterns: RegExp[] = []

  const normalizeFundCode = (raw: string) => {
    const value = String(raw || '').trim()
    const match = value.match(/\d{6}/)
    return match ? match[0] : value
  }
  
  const isQDIIFund = (code: string) => {
    const normalized = normalizeFundCode(code)
    if (KNOWN_QDII_CODES.has(normalized)) return true
    return qdiiPatterns.some(pattern => pattern.test(normalized))
  }

  const qdiiNameKeywords = [
    'qdii',
    '全球',
    '海外',
    '纳斯达克',
    '标普',
    '道琼斯',
    '日经',
    '恒生',
    'msci',
    'nasdaq',
    's&p',
    'dow',
    'hang seng',
  ]

  const isQDIIByName = (name?: string) => {
    const normalized = String(name || '').trim().toLowerCase()
    if (!normalized) return false
    return qdiiNameKeywords.some(keyword => normalized.includes(keyword))
  }

  const buildUpdateTime = (primary?: string, secondary?: string) => {
    const first = String(primary || '').trim()
    if (first) return first.replace('T', ' ').replace(/\.[0-9]+Z?$/, '')
    const second = String(secondary || '').trim()
    if (second) return second.replace('T', ' ').replace(/\.[0-9]+Z?$/, '')
    return ''
  }
  
  ipcMain.handle('db-get-fund-quotes', async (_event, codes: string[]) => {
    if (codes.length === 0) return []
    
    const uniqueCodes = Array.from(new Set(codes.map(normalizeFundCode).filter(Boolean)))
    const results: Record<string, any> = {}
    const now = Date.now()
    
    // 检查缓存
    const cachedCodes: string[] = []
    const uncachedNormalCodes: string[] = []
    const uncachedQDIICodes: string[] = []
    
    uniqueCodes.forEach(code => {
      const cached = fundCache.get(code)
      const isQDII = isQDIIFund(code)
      const cacheTTL = isQDII ? QDII_CACHE_TTL : CACHE_TTL
      
      if (cached && (now - cached.timestamp) < cacheTTL) {
        results[code] = cached.data
        cachedCodes.push(code)
      } else {
        if (isQDII) {
          uncachedQDIICodes.push(code)
        } else {
          uncachedNormalCodes.push(code)
        }
      }
    })
    
    if (cachedCodes.length > 0) {
      console.log(`📦 从缓存中获取 ${cachedCodes.length} 个基金数据`)
    }
    
    // 只获取未缓存的数据
    if (uncachedNormalCodes.length === 0 && uncachedQDIICodes.length === 0) {
      return uniqueCodes
        .map(code => results[code])
        .filter(quote => !!quote)
    }
    
    // ========== 处理普通基金 ==========
    if (uncachedNormalCodes.length > 0) {
      // 1. 第一层：东方财富 fundgz 接口 (最稳定，数据实时)
      await Promise.all(
        uncachedNormalCodes.map(async (code) => {
          try {
            const resp = await axios.get(
              `https://fundgz.1234567.com.cn/js/${code}.js`,
              {
                timeout: 6000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
              }
            )
            
            const text: string = typeof resp.data === 'string' ? resp.data : resp.data.toString()
            const match = text.match(/jsonpgz\((.*)\);?/)
            
            if (!match || !match[1]) return
            
            const json = JSON.parse(match[1])
            const fundCode = json.fundcode || code
            const name = json.name as string
            
            const gsz = parseFloat(json.gsz) || 0
            const dwjz = parseFloat(json.dwjz) || 0
            const nav = gsz || dwjz || 0
            const preNav = dwjz || 0
            
            let change = 0
            let changePercent = 0
            
            if (json.gszzl) {
              changePercent = parseFloat(json.gszzl) || 0
              change = preNav !== 0 ? (changePercent / 100) * preNav : 0
            } else if (nav !== 0 && preNav !== 0) {
              change = nav - preNav
              changePercent = (change / preNav) * 100
            }
            
            const quoteData = {
              code: fundCode,
              name,
              nav: nav || preNav || 0,
              change: Number(change.toFixed(4)),
              changePercent: Number(changePercent.toFixed(2)),
              date: (json.jzrq as string) || (json.gztime as string) || new Date().toISOString().split('T')[0],
              updateTime: buildUpdateTime(json.gztime as string, json.jzrq as string),
            }
            
            results[fundCode] = quoteData
            fundCache.set(fundCode, { data: quoteData, timestamp: now })
            
          } catch (error) {
            console.warn(`❌ EastMoney API failed for fund ${code}:`, (error instanceof Error) ? error.message : error)
          }
        })
      )
      
      // 2. 第二层：新浪财经备用接口
      const remainingNormalCodes = uncachedNormalCodes.filter(code => !results[code])
      
      if (remainingNormalCodes.length > 0) {
        try {
          const q = remainingNormalCodes.map(c => `fund_${c}`).join(',')
          const response = await axios.get(
            `http://hq.sinajs.cn/list=${q}`,
            {
              headers: {
                'Referer': 'http://finance.sina.com.cn',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
              responseType: 'arraybuffer',
              timeout: 6000,
            }
          )
          
          const decoder = new TextDecoder('gbk')
          const text = decoder.decode(response.data)
          const lines = text.split('\n').filter(line => line.trim() && line.includes('var hq_str_fund'))
          
          lines.forEach(line => {
            const match = line.match(/var hq_str_fund_([^=]+)="([^"]*)"/)
            if (!match || !match[2]) return
            
            const code = match[1]
            const raw = match[2]
            if (!raw.trim()) return
            
            const data = raw.split(',')
            if (data.length < 4) return
            
            const name = data[0]
            const nav = parseFloat(data[1]) || 0
            const preNav = parseFloat(data[2]) || 0
            
            const change = nav !== 0 ? nav - preNav : 0
            const changePercent = preNav !== 0 ? (change / preNav) * 100 : 0
            
            const quoteData = {
              code,
              name,
              nav: nav || preNav || 0,
              change: Number(change.toFixed(4)),
              changePercent: Number(changePercent.toFixed(2)),
              date: data[4] || new Date().toISOString().split('T')[0],
              updateTime: buildUpdateTime(data[4]),
            }
            
            results[code] = quoteData
            fundCache.set(code, { data: quoteData, timestamp: now })
            
          })
        } catch (error) {
          console.warn('❌ Sina API batch fetch failed:', (error instanceof Error) ? error.message : error)
        }
      }
    }
    
    // 二次判定：按基金名称识别QDII，并回流到QDII专用接口
    const normalResultCodes = uncachedNormalCodes.filter(code => !!results[code])
    const nameDetectedQDIICodes: string[] = []
    normalResultCodes.forEach(code => {
      const quote = results[code]
      if (!quote) return
      if (isQDIIFund(code)) return
      if (!isQDIIByName(quote.name)) return

      delete results[code]
      fundCache.delete(code)
      if (!uncachedQDIICodes.includes(code)) {
        uncachedQDIICodes.push(code)
      }
      nameDetectedQDIICodes.push(code)
    })

    if (nameDetectedQDIICodes.length > 0) {
      console.log(`🔎 名称识别为QDII并转专用接口: ${nameDetectedQDIICodes.join(', ')}`)
    }

    // ========== 特殊处理 QDII 基金 ==========
    if (uncachedQDIICodes.length > 0) {
      console.log(`🌍 检测到 ${uncachedQDIICodes.length} 个QDII基金，使用专门接口...`)
      
      // QDII优先使用东方财富历史净值API（获取最新发布的净值）
      await Promise.all(
        uncachedQDIICodes.map(async (code) => {
          try {
            // 东方财富历史净值API - 获取最新发布的净值数据
            const response = await axios.get(
              `https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&sdate=&edate=&code=${code}`,
              {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Referer': 'https://fundf10.eastmoney.com/',
                },
                timeout: 8000,
              }
            )
            
            const content = response.data
            if (!content || typeof content !== 'string') return
            
            // 解析HTML表格中的第一行（最新净值）
            const tableRegex = /<tbody>(.*?)<\/tbody>/s
            const tableMatch = content.match(tableRegex)
            
            if (!tableMatch || !tableMatch[1]) return
            
            const tbody = tableMatch[1]
            // 提取第一行（最新净值数据）
            const firstRowRegex = /<tr[^>]*>(.*?)<\/tr>/
            const rowMatch = tbody.match(firstRowRegex)
            
            if (!rowMatch) return
            
            // 提取行中的所有单元格
            const cellRegex = /<td[^>]*>(.*?)<\/td>/g
            const cells: string[] = []
            let cellMatch
            
            while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
              const cellText = cellMatch[1]
                .replace(/<[^>]*>/g, '') // 移除HTML标签
                .replace(/&nbsp;/g, '')
                .replace(/&amp;/g, '&')
                .trim()
              cells.push(cellText)
            }
            
            if (cells.length < 4) return
            
            // 提取数据
            const date = cells[0] // 净值日期
            const navStr = cells[1] // 单位净值
            const growthStr = cells[3] // 日增长率
            
            const nav = parseFloat(navStr) || 0
            const growthPercent = parseFloat(growthStr) || 0
            
            // 获取基金名称（从上一个查询或设置默认值）
            let fundName = `基金${code}`
            // 尝试从缓存或网络中获取基金名称
            try {
              const infoResp = await axios.get(
                `https://fundgz.1234567.com.cn/js/${code}.js`,
                { timeout: 3000, headers: { 'User-Agent': 'Mozilla/5.0' } }
              )
              const infoMatch = infoResp.data.match(/jsonpgz\((.*)\);?/)
              if (infoMatch && infoMatch[1]) {
                const infoJson = JSON.parse(infoMatch[1])
                fundName = infoJson.name || fundName
              }
            } catch (err) {
              // 获取名称失败，使用默认值
            }
            
            const quoteData = {
              code,
              name: fundName,
              nav,
              change: 0, // 仅有最新净值，无法计算涨跌额
              changePercent: growthPercent,
              date: date || new Date().toISOString().split('T')[0],
              updateTime: buildUpdateTime(date),
            }
            
            results[code] = quoteData
            fundCache.set(code, { data: quoteData, timestamp: now })
            
          } catch (error) {
            console.warn(`❌ EastMoney F10 API failed for QDII ${code}:`, (error instanceof Error) ? error.message : error)
          }
        })
      )
      
      // QDII备选：东方财富fundgz接口
      const remainingQDIICodes = uncachedQDIICodes.filter(code => !results[code])
      
      if (remainingQDIICodes.length > 0) {
        await Promise.all(
          remainingQDIICodes.map(async (code) => {
            try {
              const resp = await axios.get(
                `https://fundgz.1234567.com.cn/js/${code}.js`,
                {
                  timeout: 6000,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  },
                }
              )
              
              const text: string = typeof resp.data === 'string' ? resp.data : resp.data.toString()
              const match = text.match(/jsonpgz\((.*)\);?/)
              
              if (!match || !match[1]) return
              
              const json = JSON.parse(match[1])
              const fundCode = json.fundcode || code
              const name = json.name as string
              
              const gsz = parseFloat(json.gsz) || 0
              const dwjz = parseFloat(json.dwjz) || 0
              const nav = gsz || dwjz || 0
              const preNav = dwjz || 0
              
              let change = 0
              let changePercent = 0
              
              if (json.gszzl) {
                changePercent = parseFloat(json.gszzl) || 0
                change = preNav !== 0 ? (changePercent / 100) * preNav : 0
              } else if (nav !== 0 && preNav !== 0) {
                change = nav - preNav
                changePercent = (change / preNav) * 100
              }
              
              const quoteData = {
                code: fundCode,
                name,
                nav: nav || preNav || 0,
                change: Number(change.toFixed(4)),
                changePercent: Number(changePercent.toFixed(2)),
                date: (json.jzrq as string) || (json.gztime as string) || new Date().toISOString().split('T')[0],
                updateTime: buildUpdateTime(json.gztime as string, json.jzrq as string),
              }
              
              results[fundCode] = quoteData
              fundCache.set(fundCode, { data: quoteData, timestamp: now })
              
            } catch (error) {
              console.warn(`❌ EastMoney API failed for QDII ${code}:`, (error instanceof Error) ? error.message : error)
            }
          })
        )
      }
      
      // QDII最后备选：新浪接口
      const stillRemainingQDII = uncachedQDIICodes.filter(code => !results[code])
      
      if (stillRemainingQDII.length > 0) {
        try {
          const q = stillRemainingQDII.map(c => `fund_${c}`).join(',')
          const response = await axios.get(
            `http://hq.sinajs.cn/list=${q}`,
            {
              headers: {
                'Referer': 'http://finance.sina.com.cn',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
              responseType: 'arraybuffer',
              timeout: 6000,
            }
          )
          
          const decoder = new TextDecoder('gbk')
          const text = decoder.decode(response.data)
          const lines = text.split('\n').filter(line => line.trim() && line.includes('var hq_str_fund'))
          
          lines.forEach(line => {
            const match = line.match(/var hq_str_fund_([^=]+)="([^"]*)"/)
            if (!match || !match[2]) return
            
            const code = match[1]
            const raw = match[2]
            if (!raw.trim()) return
            
            const data = raw.split(',')
            if (data.length < 4) return
            
            const name = data[0]
            const nav = parseFloat(data[1]) || 0
            const preNav = parseFloat(data[2]) || 0
            
            const change = nav !== 0 ? nav - preNav : 0
            const changePercent = preNav !== 0 ? (change / preNav) * 100 : 0
            
            const quoteData = {
              code,
              name,
              nav: nav || preNav || 0,
              change: Number(change.toFixed(4)),
              changePercent: Number(changePercent.toFixed(2)),
              date: data[4] || new Date().toISOString().split('T')[0],
              updateTime: buildUpdateTime(data[4]),
            }
            
            results[code] = quoteData
            fundCache.set(code, { data: quoteData, timestamp: now })
            
          })
        } catch (error) {
          console.warn('❌ Sina API batch fetch failed for QDII:', (error instanceof Error) ? error.message : error)
        }
      }
    }
    
    // 通用兜底：对仍未命中的基金统一尝试东方财富 F10 历史净值接口。
    const unresolvedCodes = uniqueCodes.filter((code) => !results[code])
    if (unresolvedCodes.length > 0) {
      await Promise.all(
        unresolvedCodes.map(async (code) => {
          try {
            const response = await axios.get(
              `https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&sdate=&edate=&code=${code}`,
              {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  Referer: 'https://fundf10.eastmoney.com/',
                },
                timeout: 8000,
              },
            )

            const content = response.data
            if (!content || typeof content !== 'string') return

            const tbodyMatch = content.match(/<tbody>(.*?)<\/tbody>/s)
            if (!tbodyMatch || !tbodyMatch[1]) return

            const rowMatch = tbodyMatch[1].match(/<tr[^>]*>(.*?)<\/tr>/)
            if (!rowMatch || !rowMatch[1]) return

            const cellRegex = /<td[^>]*>(.*?)<\/td>/g
            const cells: string[] = []
            let cellMatch: RegExpExecArray | null

            while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
              const cellText = cellMatch[1]
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, '')
                .replace(/&amp;/g, '&')
                .trim()
              cells.push(cellText)
            }

            if (cells.length < 4) return

            const date = cells[0]
            const nav = parseFloat(cells[1]) || 0
            const growthPercent = parseFloat(cells[3]) || 0

            const quoteData = {
              code,
              name: `基金${code}`,
              nav,
              change: 0,
              changePercent: growthPercent,
              date: date || new Date().toISOString().split('T')[0],
              updateTime: buildUpdateTime(date),
            }

            results[code] = quoteData
            fundCache.set(code, { data: quoteData, timestamp: now })
          } catch (error) {
            console.warn(`❌ F10 fallback failed for fund ${code}:`, (error instanceof Error) ? error.message : error)
          }
        }),
      )
    }

    // 返回结果
    const finalResults = uniqueCodes
      .map(code => results[code])
      .filter(quote => !!quote)
    
    const successCount = finalResults.length
    const totalCount = uniqueCodes.length
    const qdiiSuccessCount = finalResults.filter(q => isQDIIFund(q.code) || isQDIIByName(q.name)).length
    const normalSuccessCount = successCount - qdiiSuccessCount
    
    console.log(`📊 基金数据获取完成: ${normalSuccessCount} 个普通基金, ${qdiiSuccessCount} 个QDII基金 (总 ${successCount}/${totalCount})`)
    
    return finalResults
  })
}

/**
 * 获取期货行情数据
 */
export function registerFutureQuoteHandlers() {
  const normalizeFutureSymbol = (raw: string) => {
    const value = String(raw || '').trim()
    if (!value) return ''

    if (value.startsWith('nf_') || value.startsWith('hf_')) {
      const [prefix, body] = value.split('_')
      return `${prefix.toLowerCase()}_${(body || '').toUpperCase()}`
    }

    return `nf_${value.toUpperCase()}`
  }

  const parseFutureUpdateTime = (datePart?: string, timePart?: string) => {
    const date = String(datePart || '').trim()
    const time = String(timePart || '').trim()
    if (date && time) return `${date} ${time}`
    return date || time || ''
  }

  ipcMain.handle('db-get-future-quotes', async (_event, symbols: string[]) => {
    if (symbols.length === 0) return []

    try {
      const fullSymbols = Array.from(new Set(symbols.map(normalizeFutureSymbol).filter(Boolean)))

      const response = await axios.get(`https://hq.sinajs.cn/list=${fullSymbols.join(',')}`, {
        headers: {
          Referer: 'https://finance.sina.com.cn',
          'User-Agent': 'Mozilla/5.0',
        },
        responseType: 'arraybuffer',
        timeout: 10000,
      })

      const decoder = new TextDecoder('gbk')
      const text = decoder.decode(response.data)
      const lines = text.split('\n').filter((line) => line.trim())
      return lines
        .map((line) => {
          const match = line.match(/var hq_str_([^=]+)="([^"]*)"/)
          if (!match || !match[2]) return null

          const symbol = normalizeFutureSymbol(match[1])
          const fields = match[2].split(',')
          if (fields.length < 4) return null

          if (symbol.startsWith('nf_')) {
            const firstValue = Number(fields[0])
            const isIndexFutureFormat = Number.isFinite(firstValue) && firstValue > 0

            const name = isIndexFutureFormat
              ? (fields[47] || fields[46] || symbol)
              : (fields[0] || symbol)

            const priceCandidates = isIndexFutureFormat
              ? [fields[0], fields[3], fields[2], fields[14], fields[13]]
              : [fields[8], fields[6], fields[3], fields[2], fields[1]]

            const preCloseCandidates = isIndexFutureFormat
              // 股指期货：优先昨结/昨收
              ? [fields[14], fields[15], fields[2], fields[13], fields[3]]
              // 商品期货：优先昨结，其次昨收/结算
              : [fields[10], fields[2], fields[7], fields[27], fields[9], fields[3]]

            const price = priceCandidates.map((v) => Number(v)).find((v) => Number.isFinite(v) && v > 0) || 0
            const preClose = preCloseCandidates.map((v) => Number(v)).find((v) => Number.isFinite(v) && v > 0) || 0
            const change = preClose > 0 ? price - preClose : 0
            const changePercent = preClose > 0 ? (change / preClose) * 100 : 0

            const date = isIndexFutureFormat ? fields[37] : fields[17]
            const rawTime = isIndexFutureFormat ? (fields[38] || '') : (fields[1] || '')
            const time = /^\d{6}$/.test(rawTime)
              ? `${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)}:${rawTime.slice(4, 6)}`
              : rawTime

            return {
              symbol,
              name,
              price,
              change,
              changePercent,
              updateTime: parseFutureUpdateTime(date, time),
            }
          }

          if (symbol.startsWith('hf_')) {
            const name = fields[13] || symbol
            const price = Number(fields[0]) || 0
            // 海外期货：优先昨结算价(字段7)，无则回退昨收(字段2)
            const preClose = Number(fields[7]) || Number(fields[2]) || Number(fields[8]) || 0
            const change = preClose > 0 ? price - preClose : 0
            const changePercent = preClose > 0 ? (change / preClose) * 100 : 0

            return {
              symbol,
              name,
              price,
              change,
              changePercent,
              updateTime: parseFutureUpdateTime(fields[12], fields[6]),
            }
          }

          return null
        })
        .filter((quote) => quote !== null)
    } catch (error) {
      console.error('Fetch future quotes failed:', error)
      return []
    }
  })
}

/**
 * 获取期货分时数据（当日走势，尽可能保留高密度采样点）
 */
export function registerFutureIntradayHandler() {
  const normalizeFutureSymbol = (raw: string) => {
    const value = String(raw || '').trim()
    if (!value) return ''

    if (value.startsWith('nf_') || value.startsWith('hf_')) {
      const [prefix, body] = value.split('_')
      return `${prefix.toLowerCase()}_${(body || '').toUpperCase()}`
    }

    return `nf_${value.toUpperCase()}`
  }

  const toMinuteLabel = (value: string) => {
    const normalized = String(value || '').trim()
    const match = normalized.match(/(\d{2}:\d{2})/)
    return match ? match[1] : normalized
  }

  ipcMain.handle('db-get-future-intraday', async (_event, symbol: string) => {
    const fullSymbol = normalizeFutureSymbol(symbol)
    if (!fullSymbol) {
      return { success: false, error: '期货代码不能为空' }
    }

    try {
      // 先取昨结/昨收作为涨跌基准。
      const quoteResponse = await axios.get(`https://hq.sinajs.cn/list=${fullSymbol}`, {
        headers: {
          Referer: 'https://finance.sina.com.cn',
          'User-Agent': 'Mozilla/5.0',
        },
        responseType: 'arraybuffer',
        timeout: 10000,
      })

      const quoteText = new TextDecoder('gbk').decode(quoteResponse.data)
      const quoteMatch = quoteText.match(/var hq_str_[^=]+="([^"]*)"/)
      if (!quoteMatch) {
        return { success: false, error: '期货基础行情解析失败' }
      }

      const quoteFields = quoteMatch[1].split(',')
      const isDomestic = fullSymbol.startsWith('nf_')
      const isIndexFutureFormat = isDomestic
        ? Number.isFinite(Number(quoteFields[0])) && Number(quoteFields[0]) > 0
        : false

      const preCloseCandidates = isDomestic
        ? (isIndexFutureFormat
          ? [quoteFields[14], quoteFields[15], quoteFields[2], quoteFields[13], quoteFields[3]]
          : [quoteFields[10], quoteFields[2], quoteFields[7], quoteFields[27], quoteFields[9], quoteFields[3]])
        : [quoteFields[7], quoteFields[2], quoteFields[8], quoteFields[3]]

      const yesterdayClose = preCloseCandidates
        .map((item) => Number(item))
        .find((value) => Number.isFinite(value) && value > 0) || 0

      if (isDomestic) {
        const contract = fullSymbol.replace(/^nf_/i, '')
        const response = await axios.get(
          `https://stock2.finance.sina.com.cn/futures/api/json.php/InnerFuturesNewService.getFewMinLine?symbol=${contract}&type=1`,
          {
            headers: {
              Referer: 'https://finance.sina.com.cn',
              'User-Agent': 'Mozilla/5.0',
            },
            timeout: 10000,
          },
        )

        const rows = Array.isArray(response.data) ? response.data : []
        const validRows = rows
          .map((row: any) => {
            const dateTime = String(row?.d || '').trim()
            const price = Number(row?.c)
            const volume = Number(row?.v)
            if (!dateTime || !Number.isFinite(price) || price <= 0) return null
            return {
              dateTime,
              dateKey: dateTime.split(' ')[0] || '',
              price,
              volume: Number.isFinite(volume) && volume >= 0 ? volume : 0,
            }
          })
          .filter((item): item is { dateTime: string; dateKey: string; price: number; volume: number } => item !== null)

        if (validRows.length === 0) {
          return { success: false, error: '该期货暂无分时数据' }
        }

        const latestDateKey = validRows[validRows.length - 1].dateKey
        const points = validRows
          .filter((row) => row.dateKey === latestDateKey)
          .map((row) => ({
            time: toMinuteLabel(row.dateTime),
            price: Number(row.price.toFixed(3)),
            volume: row.volume,
          }))

        return {
          success: true,
          data: {
            points,
            yesterdayClose,
          },
        }
      }

      const contract = fullSymbol.replace(/^hf_/i, '')
      const response = await axios.get(
        `https://stock2.finance.sina.com.cn/futures/api/json.php/GlobalFuturesService.getGlobalFuturesMinLine?symbol=${contract}`,
        {
          headers: {
            Referer: 'https://finance.sina.com.cn',
            'User-Agent': 'Mozilla/5.0',
          },
          timeout: 10000,
        },
      )

      type GlobalFutureLineRaw = unknown[]
      type GlobalFutureLinePoint = { dateTime: string; dateKey: string; price: number; volume: number }

      const rows: GlobalFutureLineRaw[] = Array.isArray(response.data?.minLine_1d)
        ? response.data.minLine_1d
        : []
      let currentDate = ''
      const validRows = rows
        .map((row: GlobalFutureLineRaw) => {
          if (!Array.isArray(row) || row.length < 2) return null

          const values = row.map((item) => String(item ?? '').trim())
          let dateTime: string
          let dateKey: string
          let price: number
          let volume: number

          // Sina 全球期货分时存在两种格式：
          // 1) 首条: [date, preClose, exchange, -, time, price, volume, ... , dateTime]
          // 2) 其余: [time, price, volume, ..., avgPrice, dateTime]
          if (values.length >= 10) {
            currentDate = values[0] || currentDate
            price = Number(values[5])
            volume = Number(values[6])
            dateTime = values[9] || `${currentDate} ${values[4]}`
          } else {
            price = Number(values[1])
            volume = Number(values[2])
            dateTime = values[5] || `${currentDate} ${values[0]}`
          }

          const dateMatch = dateTime.match(/\d{4}-\d{2}-\d{2}/)
          dateKey = dateMatch?.[0] || currentDate

          if (!dateTime || !dateKey || !Number.isFinite(price) || price <= 0) return null

          return {
            dateTime,
            dateKey,
            price,
            volume: Number.isFinite(volume) && volume >= 0 ? volume : 0,
          }
        })
        .filter((item): item is GlobalFutureLinePoint => item !== null)

      if (validRows.length === 0) {
        return { success: false, error: '该期货暂无分时数据' }
      }

      const latestDateKey = validRows[validRows.length - 1].dateKey
      const points = validRows
        .filter((row: GlobalFutureLinePoint) => row.dateKey === latestDateKey)
        .map((row: GlobalFutureLinePoint) => ({
          time: toMinuteLabel(row.dateTime),
          price: Number(row.price.toFixed(3)),
          volume: row.volume,
        }))

      return {
        success: true,
        data: {
          points,
          yesterdayClose,
        },
      }
    } catch (error) {
      console.error('Fetch future intraday failed:', error)
      return {
        success: false,
        error: '获取期货分时数据失败',
      }
    }
  })
}

/**
 * 获取股票分时数据（今天的走势）
 */
export function registerStockIntradayHandler() {
  ipcMain.handle('db-get-stock-intraday', async (_event, symbol: string) => {
    try {
      // 确保有前缀
      let fullSymbol = symbol.toLowerCase()
      if (!/^[a-z]{2}[0-9]+/.test(fullSymbol)) {
        if (/^[0-9]{6}$/.test(symbol)) {
          if (symbol.startsWith('6') || symbol.startsWith('5')) {
            fullSymbol = `sh${symbol}`
          } else if (symbol.startsWith('0') || symbol.startsWith('3') || symbol.startsWith('1')) {
            fullSymbol = `sz${symbol}`
          }
        }
      }

      console.log('Fetching intraday data for:', fullSymbol)

      // 新浪分时接口获取基本信息和昨收价
      const url = `http://hq.sinajs.cn/list=${fullSymbol}`
      const response = await axios.get(url, {
        headers: {
          Referer: 'http://finance.sina.com.cn',
        },
        responseType: 'arraybuffer',
        timeout: 10000,
      })

      const decoder = new TextDecoder('gbk')
      const text = decoder.decode(response.data)
      
      // 解析数据获取昨收价
      const match = text.match(/var hq_str_[^=]+="([^"]+)"/)
      if (!match) {
        return { success: false, error: '数据格式错误' }
      }

      const data = match[1].split(',')
      if (data.length < 4) {
        return { success: false, error: '数据不完整' }
      }

      const yesterdayClose = parseFloat(data[2]) // 昨收价
      console.log('Yesterday close:', yesterdayClose)

      // 使用新浪分时数据接口
      const market = fullSymbol.startsWith('sh') ? 'sh' : 'sz'
      const code = fullSymbol.substring(2)
      
      const fetchIntradayByScale = async (scale: number, datalen: number) => {
        const intradayUrl = `https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData?symbol=${market}${code}&scale=${scale}&ma=no&datalen=${datalen}`
        console.log('Fetching intraday from Sina:', intradayUrl)

        const intradayResponse = await axios.get(intradayUrl, {
          headers: {
            Referer: 'https://finance.sina.com.cn',
          },
          timeout: 10000,
        })

        return intradayResponse.data
      }

      // 优先 1 分钟粒度；若接口不可用则回退 5 分钟，保证可用性。
      let intradayData: any[] = []
      try {
        const oneMinuteData = await fetchIntradayByScale(1, 600)
        intradayData = Array.isArray(oneMinuteData) ? oneMinuteData : []
      } catch (error) {
        console.warn('1-minute intraday unavailable, fallback to 5-minute:', error)
      }

      if (intradayData.length === 0) {
        const fiveMinuteData = await fetchIntradayByScale(5, 288)
        intradayData = Array.isArray(fiveMinuteData) ? fiveMinuteData : []
      }
      
      if (!intradayData || !Array.isArray(intradayData) || intradayData.length === 0) {
        console.error('Intraday data is empty or invalid')
        return { success: false, error: '分时数据为空' }
      }

      console.log('Intraday data length:', intradayData.length)
      console.log('First data point:', intradayData[0])

      // 转换为走势图数据格式
      // 新浪返回格式: {day: "2026-03-06 09:35:00", open: "10.880", high: "10.890", low: "10.880", close: "10.885", volume: "1234567"}
      const points = intradayData
        .filter((item: any) => {
          // 只取今天的数据
          const itemDate = new Date(item.day)
          const today = new Date()
          return itemDate.toDateString() === today.toDateString()
        })
        .map((item: any) => {
          const timeStr = item.day.split(' ')[1] // 提取时间部分 "09:35:00"
          const time = timeStr.substring(0, 5) // 截取 "09:35"
          
          return {
            time,
            price: parseFloat(item.close),
            volume: parseInt(item.volume) || 0,
          }
        })

      if (points.length === 0) {
        return { success: false, error: '今日暂无分时数据' }
      }

      console.log('Converted points:', points.length, 'first point:', points[0])

      return {
        success: true,
        data: {
          points,
          yesterdayClose,
        },
      }
    } catch (error) {
      console.error('Fetch stock intraday failed:', error)
      return {
        success: false,
        error: '获取分时数据失败: ' + (error instanceof Error ? error.message : String(error))
      }
    }
  })
}

/**
 * 注册所有行情相关的 IPC handlers
 */
export function registerAllQuoteHandlers() {
  registerStockQuoteHandlers()
  registerFundQuoteHandlers()
  registerFutureQuoteHandlers()
  registerFutureIntradayHandler()
  registerGlobalIndexQuoteHandlers()
  registerGlobalIndexTrendHandler()
  registerStockIntradayHandler()
}
