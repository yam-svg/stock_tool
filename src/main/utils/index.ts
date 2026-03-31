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
    case 'KR':
      return { start: 9 * 60, end: 15 * 60 + 30 }
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
export function isMarketOpenByTimezone(market: string, timezone: string): boolean {
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


// ==== 解析新浪行情数据 ====
export function parseSinaData(text: string): Map<string, { price: number; changePercent: number }> {
  const result = new Map<string, { price: number; changePercent: number }>()
  const regex = /var hq_str_(.*?)="(.*?)"/g
  let match: RegExpExecArray | null
  
  while ((match = regex.exec(text)) !== null) {
    const sinaSymbol = match[1]
    const raw = match[2]
    if (!raw) continue
    const arr = raw.split(",")
    
    let price = 0
    let changePercent = 0
    
    // 全球指数（美股 / 标普 / 日经 / DAX / FTSE）
    if (sinaSymbol.startsWith("gb_")) {
      price = parseFloat(arr[1])
      changePercent = parseFloat(arr[2])
    }
    // 恒生指数 / 恒生科技（新浪港股指数格式）
    else if (sinaSymbol.startsWith("rt_hk")) {
      price = parseFloat(arr[2])
      const previousClose = parseFloat(arr[3])
      if (!isNaN(price) && !isNaN(previousClose) && previousClose > 0) {
        changePercent = ((price - previousClose) / previousClose) * 100
      }
    }
    // A股指数
    else if (sinaSymbol.startsWith("sh") || sinaSymbol.startsWith("sz")) {
      const yesterdayClose = parseFloat(arr[2])
      price = parseFloat(arr[3])
      if (!isNaN(price) && !isNaN(yesterdayClose) && yesterdayClose > 0) {
        changePercent = ((price - yesterdayClose) / yesterdayClose) * 100
      }
    }
    
    if (!isNaN(price)) {
      result.set(sinaSymbol, { price, changePercent })
    }
  }
  
  return result
}
