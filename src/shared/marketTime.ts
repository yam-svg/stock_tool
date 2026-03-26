/**
 * 市场交易时间工具函数
 */

export type MarketType = 'stock' | 'future'

const isWeekend = (day: number) => day === 0 || day === 6

const isStockMarketOpenByTime = (day: number, time: number) => {
  if (isWeekend(day)) return false
  const morningStart = 9 * 60 + 30
  const morningEnd = 11 * 60 + 30
  const afternoonStart = 13 * 60
  const afternoonEnd = 15 * 60
  return (time >= morningStart && time <= morningEnd) || (time >= afternoonStart && time <= afternoonEnd)
}

const isFutureMarketOpenByTime = (day: number, time: number) => {
  // 日盘：周一至周五 09:00-11:30、13:30-15:00
  const isWeekday = day >= 1 && day <= 5
  const dayOpen = isWeekday && ((time >= 9 * 60 && time <= 11 * 60 + 30) || (time >= 13 * 60 + 30 && time <= 15 * 60))

  // 夜盘：周一至周四 21:00-23:59；次日 00:00-02:30（即周二至周五凌晨）
  const nightOpen = day >= 1 && day <= 4 && time >= 21 * 60
  const earlyMorningOpen = day >= 2 && day <= 5 && time <= 2 * 60 + 30

  return dayOpen || nightOpen || earlyMorningOpen
}

/**
 * 判断当前是否为股票交易时间
 * A股交易时间：
 * - 周一至周五（节假日除外）
 * - 上午：09:30 - 11:30
 * - 下午：13:00 - 15:00
 */
export function isMarketOpen(market: MarketType = 'stock'): boolean {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 60 + minute // 转换为分钟数便于比较

  return market === 'future'
    ? isFutureMarketOpenByTime(day, time)
    : isStockMarketOpenByTime(day, time)
}

/**
 * 获取下一个开市时间的描述
 * @returns 描述字符串，如 "今日 13:00 开市" 或 "周一 09:30 开市"
 */
export function getNextMarketOpenTime(market: MarketType = 'stock'): string {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 60 + minute

  if (market === 'future') {
    if (isFutureMarketOpenByTime(day, time)) {
      return '交易时间'
    }

    if (isWeekend(day)) {
      return '周一 09:00 开市'
    }

    if (time < 2 * 60 + 30) {
      return '今日 09:00 开市'
    }

    if (time < 9 * 60) {
      return '今日 09:00 开市'
    }

    if (time > 11 * 60 + 30 && time < 13 * 60 + 30) {
      return '今日 13:30 开市'
    }

    if (time >= 15 * 60 && time < 21 * 60) {
      return day === 5 ? '周一 09:00 开市' : '今日 21:00 开市'
    }

    if (time >= 21 * 60) {
      return '明日 09:00 开市'
    }

    return '交易时间'
  }

  // 周末
  if (day === 0) {
    return '周一 09:30 开市'
  }
  if (day === 6) {
    return '周一 09:30 开市'
  }

  // 工作日
  const morningStart = 9 * 60 + 30
  const afternoonStart = 13 * 60

  // 早于上午开盘
  if (time < morningStart) {
    return '今日 09:30 开市'
  }

  // 午休时间
  if (time > 11 * 60 + 30 && time < afternoonStart) {
    return '今日 13:00 开市'
  }

  // 收盘后
  if (time >= 15 * 60) {
    if (day === 5) { // 周五
      return '周一 09:30 开市'
    }
    return '明日 09:30 开市'
  }

  return '交易时间'
}

/**
 * 计算距离下一次开市的毫秒数
 * 用于设置定时器在开市时自动启用刷新
 */
export function getTimeUntilMarketOpen(): number {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 60 + minute

  let targetTime: Date

  // 周末 -> 下周一 09:30
  if (day === 0) {
    targetTime = new Date(now)
    targetTime.setDate(now.getDate() + 1)
    targetTime.setHours(9, 30, 0, 0)
  } else if (day === 6) {
    targetTime = new Date(now)
    targetTime.setDate(now.getDate() + 2)
    targetTime.setHours(9, 30, 0, 0)
  }
  // 工作日
  else {
    // 早于上午开盘
    if (time < 9 * 60 + 30) {
      targetTime = new Date(now)
      targetTime.setHours(9, 30, 0, 0)
    }
    // 午休时间
    else if (time >= 11 * 60 + 30 && time < 13 * 60) {
      targetTime = new Date(now)
      targetTime.setHours(13, 0, 0, 0)
    }
    // 收盘后
    else if (time >= 15 * 60) {
      targetTime = new Date(now)
      if (day === 5) { // 周五 -> 下周一
        targetTime.setDate(now.getDate() + 3)
      } else {
        targetTime.setDate(now.getDate() + 1)
      }
      targetTime.setHours(9, 30, 0, 0)
    }
    // 交易中（不应该走到这里）
    else {
      return 0
    }
  }

  return targetTime.getTime() - now.getTime()
}

