import axios from 'axios'
import { ipcMain } from 'electron'
import iconv from 'iconv-lite'
import { isMarketOpenByTimezone, parseSinaData } from '../utils'
import { API_TOKEN, GLOBAL_INDEXES, SINA_SYMBOL_MAP } from '../utils/constants'

/**
 * 注册 IPC：获取全球指数行情
 */
export async function registerGlobalIndexQuoteHandlers() {
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
    
    // 2️⃣ 日经225通过Twelve Data API（免费注册Token）
    try {
      const tdRes = await axios.get(
        `https://api.twelvedata.com/quote?symbol=XYM/JPY&apikey=${API_TOKEN}`
      )
      const data = tdRes.data
      if (data && data.price) {
        quoteMap.set("gb_nky", {
          price: parseFloat(data.price),
          changePercent: parseFloat(data.change_percent),
        })
      }
    } catch (err) {
      console.warn("Twelve Data 日经接口失败", err)
    }
    
    // 3️⃣ 构建统一返回结果
    return GLOBAL_INDEXES.map((item) => {
      const sinaSymbol = SINA_SYMBOL_MAP[item.symbol]
      const quote = quoteMap.get(sinaSymbol)
      
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
      
      // 新浪分时数据接口（返回今天的分时数据）
      const intradayUrl = `https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketDataService.getKLineData?symbol=${market}${code}&scale=5&ma=no&datalen=288`
      
      console.log('Fetching intraday from Sina:', intradayUrl)
      
      const intradayResponse = await axios.get(intradayUrl, {
        headers: {
          Referer: 'https://finance.sina.com.cn',
        },
        timeout: 10000,
      })

      const intradayData = intradayResponse.data
      
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
  registerGlobalIndexQuoteHandlers()
  registerStockIntradayHandler()
}
