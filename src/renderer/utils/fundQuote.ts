import { Fund, FundQuote } from '../../shared/types'

const toTwo = (value: number) => String(value).padStart(2, '0')

const buildLocalDate = (date: Date) => `${date.getFullYear()}-${toTwo(date.getMonth() + 1)}-${toTwo(date.getDate())}`

const extractDateToken = (raw?: string): string | null => {
  const value = String(raw || '').trim()
  if (!value) return null

  const normalized = value.replace(/[./]/g, '-').replace(/T/g, ' ')

  // 优先匹配 YYYY-MM-DD
  const fullDateMatch = normalized.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (fullDateMatch) {
    const year = Number(fullDateMatch[1])
    const month = Number(fullDateMatch[2])
    const day = Number(fullDateMatch[3])
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${toTwo(month)}-${toTwo(day)}`
    }
  }

  // 兼容 MM-DD（无年份时默认当前年）
  const monthDayMatch = normalized.match(/(^|\s)(\d{1,2})-(\d{1,2})(\s|$)/)
  if (monthDayMatch) {
    const month = Number(monthDayMatch[2])
    const day = Number(monthDayMatch[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const currentYear = new Date().getFullYear()
      return `${currentYear}-${toTwo(month)}-${toTwo(day)}`
    }
  }

  return null
}

const qdiiKeywords = [
  'qdii',
  '海外',
  '全球',
  '纳斯达克',
  '标普',
  '道琼斯',
  '恒生',
  'msci',
  'nasdaq',
  's&p',
  'dow',
]

const overseasKeywords = [
  '海外',
  '全球',
  '纳斯达克',
  '标普',
  '道琼斯',
  '恒生',
  'msci',
  'nasdaq',
  's&p',
  'dow',
  '美股',
  '港股',
]

const isQdiiFund = (fund?: Pick<Fund, 'fundType' | 'name'>, quote?: Pick<FundQuote, 'name'>) => {
  const fundType = String(fund?.fundType || '').toLowerCase()
  const mergedText = `${fundType} ${fund?.name || ''} ${quote?.name || ''}`.toLowerCase()

  // 仅当存在明确海外市场特征时才按 QDII 规则处理，避免国内商品/期货 LOF 被误判。
  const hasOverseasSignal = overseasKeywords.some((keyword) => mergedText.includes(keyword))
  if (fundType.includes('qdii') && hasOverseasSignal) return true

  const text = `${fund?.name || ''} ${quote?.name || ''}`.toLowerCase()

  if (fund?.name.includes('白银')) {
    console.log(fund, quote?.name)
  }
  
  return qdiiKeywords.some((keyword) => text.includes(keyword))
}

const isWeekend = (date: Date) => {
  const day = date.getDay()
  return day === 0 || day === 6
}

const previousTradingDay = (date: Date) => {
  const cursor = new Date(date)
  cursor.setDate(cursor.getDate() - 1)
  while (isWeekend(cursor)) {
    cursor.setDate(cursor.getDate() - 1)
  }
  return cursor
}

const expectedLatestNavDate = (now: Date, isQdii: boolean) => {
  if (isWeekend(now)) {
    return buildLocalDate(previousTradingDay(now))
  }

  // 普通基金：仅当净值日期达到“今天”才标记已更新。
  if (!isQdii) {
    return buildLocalDate(now)
  }

  // QDII 基金通常按 T+1 发布净值，按上一交易日作为“今日应更新到”的目标。
  return buildLocalDate(previousTradingDay(now))
}

export const isFundQuoteUpdatedToday = (quote?: FundQuote, fund?: Pick<Fund, 'fundType' | 'name'>): boolean => {
  if (!quote) return false

  // 接口无有效净值时，禁止标记“今日已更新”（避免 fallback 数据误判）。
  const nav = Number(quote.nav)
  if (!Number.isFinite(nav) || nav <= 0) return false

  const navDateToken = extractDateToken(quote.date) || extractDateToken(quote.updateTime)
  if (!navDateToken) return false

  const now = new Date()
  
  const expectedDate = expectedLatestNavDate(now, isQdiiFund(fund, quote))

  // 允许接口提前给到更“新”的日期，视为已更新。
  return navDateToken >= expectedDate
}

