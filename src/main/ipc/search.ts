import { ipcMain } from 'electron'
import axios from 'axios'
import iconv from 'iconv-lite'
import { FUTURE_CONTRACTS } from '../../shared/futureContracts'

/**
 * 基金搜索 handler
 */
export function registerFundSearchHandler() {
  ipcMain.handle('fund-search', async (_event, keyword: string) => {
    if (!keyword.trim()) return []

    try {
      const response = await axios.get('https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx', {
        params: {
          m: 1,
          key: keyword
        }
      })

      const data = response.data as { Datas?: Array<{ CODE: string; NAME: string }> }
      const list = data?.Datas || []

      return list.map(item => ({
        code: item.CODE,
        name: item.NAME,
        ...item
      }))
    } catch (error) {
      console.error('Fund search failed:', error)
      return []
    }
  })
}

/**
 * 股票搜索 handler
 */
export function registerStockSearchHandler() {
  ipcMain.handle('stock-search', async (_event, keyword: string) => {
    if (!keyword.trim()) return []

    try {
      const response = await axios.get(`https://suggest3.sinajs.cn/suggest/key=${encodeURIComponent(keyword)}`, {
        responseType: 'arraybuffer'
      })

      const decoder = new TextDecoder('gbk')
      const text = decoder.decode(response.data)

      // var suggestdata_1710000000000 = "贵州茅台,11,600519,sh600519,贵州茅台,,贵州茅台,99;..."
      const match = text.match(/"([^"]+)"/)
      if (!match) return []

      const items = match[1].split(';')
      return items
        .map(item => {
          const parts = item.split(',')
          // parts[0]: name, parts[2]: code, parts[3]: fullSymbol
          return {
            symbol: parts[3] || parts[2],
            name: parts[0]
          }
        })
        .filter(item => item.symbol && item.name)
    } catch (error) {
      console.error('Stock search failed:', error)
      return []
    }
  })
}

/**
 * 期货搜索 handler
 */
export function registerFutureSearchHandler() {
  ipcMain.handle('future-search', async (_event, keyword: string) => {
    const trimmed = keyword.trim().toLowerCase()
    if (!trimmed) return []

    const normalizeFutureSymbol = (raw: string) => {
      const value = String(raw || '').trim()
      if (!value) return ''
      if (value.startsWith('nf_') || value.startsWith('hf_')) {
        const [prefix, body] = value.split('_')
        return `${prefix.toLowerCase()}_${(body || '').toUpperCase()}`
      }
      return `nf_${value.toUpperCase()}`
    }

    const remoteResults: Array<{ symbol: string; name: string; market: 'CN' | 'INTL' }> = []

    try {
      const response = await axios.get(`https://suggest3.sinajs.cn/suggest/key=${encodeURIComponent(trimmed)}`, {
        responseType: 'arraybuffer',
        timeout: 8000,
      })

      const text = iconv.decode(response.data, 'gbk')
      const match = text.match(/"([^"]*)"/)
      const payload = match?.[1] || ''

      if (payload) {
        const rows = payload.split(';').filter(Boolean)
        rows.forEach((row) => {
          const parts = row.split(',')
          if (parts.length < 5) return

          const type = parts[1]
          // 88: 国内期货主力/合约；87: 期货相关（部分连续）
          if (type !== '88' && type !== '87') return

          const code = parts[2] || parts[3]
          const symbol = normalizeFutureSymbol(code)
          if (!symbol) return

          const cnName = String(parts[4] || '').trim()
          const enName = String(parts[0] || '').trim()
          const name = cnName || enName || symbol

          remoteResults.push({
            symbol,
            name,
            market: 'CN',
          })
        })
      }
    } catch (error) {
      console.warn('Future search via Sina suggest failed:', error)
    }

    const fallbackResults = FUTURE_CONTRACTS.filter((item) => {
      if (item.symbol.toLowerCase().includes(trimmed)) return true
      if (item.name.toLowerCase().includes(trimmed)) return true
      return (item.aliases || []).some((alias) => alias.toLowerCase().includes(trimmed))
    }).map((item) => ({
      symbol: item.symbol,
      name: item.name,
      market: item.market,
    }))

    // 去重：优先保留接口结果，其次本地内置合约（便于补齐国际主流合约）。
    const dedup = new Map<string, { symbol: string; name: string; market: 'CN' | 'INTL' }>()
    ;[...remoteResults, ...fallbackResults].forEach((item) => {
      if (!dedup.has(item.symbol)) {
        dedup.set(item.symbol, item)
      }
    })

    return Array.from(dedup.values()).slice(0, 80)
  })
}

/**
 * 注册所有搜索相关的 IPC handlers
 */
export function registerAllSearchHandlers() {
  registerFundSearchHandler()
  registerStockSearchHandler()
  registerFutureSearchHandler()
}

