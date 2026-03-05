/**
 * 市场交易时间工具函数
 */

/**
 * 判断当前是否为股票交易时间
 * A股交易时间：
 * - 周一至周五（节假日除外）
 * - 上午：09:30 - 11:30
 * - 下午：13:00 - 15:00
 */
export function isMarketOpen(): boolean {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 60 + minute // 转换为分钟数便于比较

  // 周末不开市
  if (day === 0 || day === 6) {
    return false
  }

  // 上午开市时间：09:30 - 11:30
  const morningStart = 9 * 60 + 30  // 09:30
  const morningEnd = 11 * 60 + 30   // 11:30

  // 下午开市时间：13:00 - 15:00
  const afternoonStart = 13 * 60    // 13:00
  const afternoonEnd = 15 * 60      // 15:00

  // 判断是否在交易时间段内
  return (time >= morningStart && time <= morningEnd) ||
         (time >= afternoonStart && time <= afternoonEnd)
}

/**
 * 获取下一个开市时间的描述
 * @returns 描述字符串，如 "今日 13:00 开市" 或 "周一 09:30 开市"
 */
export function getNextMarketOpenTime(): string {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 60 + minute

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

