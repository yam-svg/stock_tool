import axios from 'axios'
import { ipcMain } from 'electron'
import iconv from 'iconv-lite'
import { GlobalIndexQuote } from '../../shared/types'

type GlobalIndexConfig = {
  symbol: string
  code: string
  nameEn: string
  nameCn: string
  market: string
  timezone: string
}

const GLOBAL_INDEXES: GlobalIndexConfig[] = [
  { symbol: '^GSPC', code: 'SPX', nameEn: 'S&P 500', nameCn: '标普500', market: 'US', timezone: 'America/New_York' },
  { symbol: '^DJI', code: 'DJI', nameEn: 'Dow Jones', nameCn: '道琼斯', market: 'US', timezone: 'America/New_York' },
  { symbol: '^IXIC', code: 'IXIC', nameEn: 'NASDAQ', nameCn: '纳斯达克', market: 'US', timezone: 'America/New_York' },
  { symbol: '^FTSE', code: 'FTSE', nameEn: 'FTSE 100', nameCn: '富时100', market: 'UK', timezone: 'Europe/London' },
  { symbol: '^GDAXI', code: 'DAX', nameEn: 'DAX', nameCn: '德国DAX', market: 'DE', timezone: 'Europe/Berlin' },
  { symbol: '^N225', code: 'N225', nameEn: 'Nikkei 225', nameCn: '日经225', market: 'JP', timezone: 'Asia/Tokyo' },
  { symbol: '^HSI', code: 'HSI', nameEn: 'Hang Seng', nameCn: '恒生指数', market: 'HK', timezone: 'Asia/Hong_Kong' },
  {
    symbol: '000001.SS',
    code: 'SSE',
    nameEn: 'SSE Composite',
    nameCn: '上证指数',
    market: 'CN',
    timezone: 'Asia/Shanghai',
  },
  {
    symbol: '399001.SZ',
    code: 'SZSE',
    nameEn: 'SZSE Component',
    nameCn: '深证成指',
    market: 'CN',
    timezone: 'Asia/Shanghai',
  },
  {
    symbol: '000300.SS',
    code: 'CSI300',
    nameEn: 'CSI 300',
    nameCn: '沪深300',
    market: 'CN',
    timezone: 'Asia/Shanghai',
  },
]

function getMarketSessionMinutes(market: string): {
  start: number;
  end: number;
  lunchStart?: number;
  lunchEnd?: number
} {
  switch (market) {
    case 'CN':
      return { start: 9 * 60 + 30, end: 15 * 60, lunchStart: 11 * 60 + 30, lunchEnd: 13 * 60 }
    case 'HK':
      return { start: 9 * 60 + 30, end: 16 * 60, lunchStart: 12 * 60, lunchEnd: 13 * 60 }
    case 'JP':
      return { start: 9 * 60, end: 15 * 60, lunchStart: 11 * 60 + 30, lunchEnd: 12 * 60 + 30 }
    case 'US':
      return { start: 9 * 60 + 30, end: 16 * 60 }
    case 'UK':
      return { start: 8 * 60, end: 16 * 60 + 30 }
    case 'DE':
      return { start: 9 * 60, end: 17 * 60 + 30 }
    default:
      return { start: 9 * 60, end: 16 * 60 }
  }
}

/**
 * 判断市场是否开市
 * @param market 市场代码 (CN, US, HK, JP, UK, DE)
 * @param timezone 时区
 * @returns 是否开市
 */
function isMarketOpenByTimezone(market: string, timezone: string): boolean {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(now)
  
  const weekday = parts.find((p) => p.type === 'weekday')?.value || 'Mon'
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || '0')
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const day = dayMap[weekday] ?? 1
  
  // 周末不开市
  if (day === 0 || day === 6) return false
  
  const current = hour * 60 + minute
  const session = getMarketSessionMinutes(market)
  
  // 检查交易时间范围
  if (current < session.start || current > session.end) return false
  
  // 检查午休时间（若有午休，在午休时间内不开市）
  if (session.lunchStart !== undefined && session.lunchEnd !== undefined) {
    if (current >= session.lunchStart && current <= session.lunchEnd) return false
  }
  
  return true
}

/**
 * 解析新浪返回的全球指数数据
 *
 * 新浪返回格式：
 * var hq_str_gb_dji="道琼斯,39123.45,1.23,2026-03-05 06:30:00,....";
 *
 * 字段结构（全球指数）：
 * 0  名称
 * 1  最新价
 * 2  涨跌幅 %
 * 3  时间
 * 4  涨跌额
 * 5  开盘
 * 6  最高
 * 7  最低
 *
 * @param text 新浪返回的原始文本
 * @param symbolMap 新浪symbol -> 标准symbol
 */
function parseSinaGlobalIndexData(
  text: string,
  symbolMap: Record<string, string>
): Map<string, { price: number; changePercent: number }> {
  const quoteMap = new Map<string, { price: number; changePercent: number }>()
  
  const regex = /var hq_str_([^=]+)="([^"]*)"/g
  let match: RegExpExecArray | null
  
  while ((match = regex.exec(text)) !== null) {
    const sinaSymbol = match[1].toUpperCase()
    const rawData = match[2]
    
    const stdSymbol = symbolMap[sinaSymbol]
    if (!stdSymbol || !rawData) continue
    
    const data = rawData.split(',')
    
    let price = 0
    let changePercent = 0
    
    // ===== 全球指数 (gb_) =====
    if (sinaSymbol.startsWith('GB_') || sinaSymbol.startsWith('RT_HK')) {
      if (data.length >= 3) {
        price = Number(data[1])
        changePercent = Number(data[2])
      }
    }
    
    // ===== A股指数 =====
    else if (sinaSymbol.startsWith('SH') || sinaSymbol.startsWith('SZ')) {
      if (data.length >= 4) {
        const yesterdayClose = Number(data[2])
        price = Number(data[3])
        
        if (yesterdayClose > 0) {
          changePercent = ((price - yesterdayClose) / yesterdayClose) * 100
        }
      }
    }
    
    if (Number.isFinite(price)) {
      quoteMap.set(stdSymbol, {
        price,
        changePercent
      })
    }
  }
  
  return quoteMap
}

/**
 * 注册 IPC：获取全球指数行情
 */
export function registerGlobalIndexQuoteHandlers() {
  ipcMain.handle('db-get-global-index-quotes', async () => {
    const now = Date.now()
    
    /**
     * 新浪symbol -> 标准symbol
     *
     * 注意：
     * 新浪 symbol 必须大写
     */
    const symbolMap: Record<string, string> = {
      GB_DJI: '^DJI',
      GB_IXIC: '^IXIC',
      'GB_$INX': '^GSPC',
      RT_HKHSI: '^HSI',
      SH000001: '000001.SS',
      SZ399001: '399001.SZ',
      SH000300: '000300.SS',
    }
    
    const quoteMap = new Map<string, { price: number; changePercent: number }>()
    
    /**
     * 新浪接口
     */
    const url =
      'https://hq.sinajs.cn/list=gb_dji,gb_ixic,gb_$inx,rt_hkHSI,sh000001,sz399001,sh000300'
    
    try {
      const response = await axios.get(url, {
        headers: {
          Referer: 'https://finance.sina.com.cn',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        },
        
        /**
         * 必须用 arraybuffer
         * 因为新浪返回是 GBK
         */
        responseType: 'arraybuffer',
        timeout: 10000,
      })
      
      /**
       * 新浪返回 GBK
       */
      const text = iconv.decode(response.data, 'gbk')
      
      const parsed = parseSinaGlobalIndexData(text, symbolMap)
      
      parsed.forEach((v, k) => {
        quoteMap.set(k, v)
      })
    } catch (error) {
      console.error('Fetch sina quotes failed:', error)
    }
    
    /**
     * 构建返回结构
     */
    const result: GlobalIndexQuote[] = GLOBAL_INDEXES.map((item) => {
      const quote = quoteMap.get(item.symbol)
      
      return {
        symbol: item.symbol,
        code: item.code,
        name: `${item.nameCn} (${item.nameEn})`,
        market: item.market,
        value: quote?.price ?? 0,
        changePercent: quote?.changePercent ?? 0,
        isOpen: isMarketOpenByTimezone(item.market, item.timezone),
        updateTime: now,
      }
    })
    
    return result
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
 * 获取基金行情数据
 */
export function registerFundQuoteHandlers() {
  ipcMain.handle('db-get-fund-quotes', async (_event, codes: string[]) => {
    if (codes.length === 0) return []
    
    const uniqueCodes = Array.from(new Set(codes))
    const results: Record<string, any> = {}
    
    // 1. 优先使用东方财富 fundgz 接口
    await Promise.all(
      uniqueCodes.map(async (code) => {
        try {
          const resp = await axios.get(`https://fundgz.1234567.com.cn/js/${code}.js`, {
            timeout: 5000,
          })
          const text: string = typeof resp.data === 'string' ? resp.data : resp.data.toString()
          const match = text.match(/jsonpgz\((.*)\);?/)
          if (!match) return
          
          const json = JSON.parse(match[1])
          const fundCode = json.fundcode || code
          const name = json.name as string
          const dwjz = parseFloat(json.dwjz) || 0 // 单位净值（昨日净值）
          const gsz = parseFloat(json.gsz) || dwjz // 估算净值
          const nav = gsz || dwjz
          const preNav = dwjz
          const change = nav !== 0 && preNav !== 0 ? nav - preNav : 0
          const changePercent = preNav !== 0 ? (change / preNav) * 100 : 0
          const date = (json.jzrq as string) || (json.gztime as string) || ''
          
          results[fundCode] = {
            code: fundCode,
            name,
            nav,
            change,
            changePercent,
            date,
          }
        } catch (error) {
          console.error('EastMoney fundgz fetch failed for', code, error)
        }
      }),
    )
    
    // 2. 剩余的代码回退到新浪接口
    const remainingCodes = uniqueCodes.filter(code => !results[code])
    
    if (remainingCodes.length > 0) {
      try {
        const q = remainingCodes.map(c => `fund_${c}`).join(',')
        const response = await axios.get(`http://hq.sinajs.cn/list=${q}`, {
          headers: {
            Referer: 'http://finance.sina.com.cn',
          },
          responseType: 'arraybuffer',
        })
        
        const decoder = new TextDecoder('gbk')
        const text = decoder.decode(response.data)
        const lines = text.split('\n').filter(line => line.trim())
        
        lines.forEach(line => {
          const match = line.match(/var hq_str_fund_([^=]+)="([^"]*)"/)
          if (!match) return
          
          const code = match[1]
          const raw = match[2]
          if (!raw) return
          
          const data = raw.split(',')
          if (data.length < 4) return
          
          const name = data[0]
          const nav = parseFloat(data[1]) // 当前净值
          const preNav = parseFloat(data[2]) // 昨日净值
          
          const change = nav !== 0 ? nav - preNav : 0
          const changePercent = preNav !== 0 ? (change / preNav) * 100 : 0
          
          results[code] = {
            code,
            name,
            nav: nav || preNav || 0,
            change,
            changePercent,
            date: data[4],
          }
        })
      } catch (error) {
        console.error('Fetch fund quotes from Sina failed:', error)
      }
    }
    
    // 3. 按请求顺序返回已有结果
    return uniqueCodes.map(code => results[code]).filter(quote => !!quote)
  })
}

/**
 * 注册所有行情相关的 IPC handlers
 */
export function registerAllQuoteHandlers() {
  registerStockQuoteHandlers()
  registerFundQuoteHandlers()
  registerGlobalIndexQuoteHandlers()
}
