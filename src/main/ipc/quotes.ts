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
 * 获取基金行情数据 - 使用多重备用接口方案 (东方财富 + 新浪 + 网易)
 * 特别优化了QDII基金的数据获取
 */
export function registerFundQuoteHandlers() {
  // 本地缓存，减少频繁调用接口
  const fundCache = new Map<string, { data: any; timestamp: number }>()
  const CACHE_TTL = 60000 // 1分钟缓存
  const QDII_CACHE_TTL = 30000 // QDII基金30秒缓存（更激进的更新）
  const KNOWN_QDII_CODES = new Set(['017437'])
  
  // QDII基金代码列表（以及其他跨境基金）
  const qdiiPatterns = [
    /^(001|002|160|161|162|163|164|165|166|167|168|169)\d{3}$/,
    /^01(7|8|9)\d{3}$/, // 补充 017xxx/018xxx/019xxx，覆盖 017437
    /^(180|470|519)\d{3}$/,
  ]

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
            
            console.log(`✅ Fund ${fundCode} (EastMoney): nav=${nav}, change=${changePercent.toFixed(2)}%`)
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
            
            console.log(`✅ Fund ${code} (Sina): nav=${nav}, change=${changePercent.toFixed(2)}%`)
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
            let fundName = `QDII基金${code}`
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
            
            console.log(`✅ QDII ${code} (EastMoney F10): nav=${nav}, date=${date}, change=${growthPercent}%`)
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
              
              console.log(`✅ QDII ${fundCode} (EastMoney): nav=${nav}, change=${changePercent.toFixed(2)}%`)
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
            
            console.log(`✅ QDII ${code} (Sina): nav=${nav}, change=${changePercent.toFixed(2)}%`)
          })
        } catch (error) {
          console.warn('❌ Sina API batch fetch failed for QDII:', (error instanceof Error) ? error.message : error)
        }
      }
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
