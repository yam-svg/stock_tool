/**
 * IPC handlers 统一入口
 * 导出所有IPC handler注册函数
 */
export { registerAllStockHandlers } from './stock'
export { registerAllFundHandlers } from './fund'
export { registerAllFutureHandlers } from './future'
export { registerAllQuoteHandlers } from './quotes'
export { registerAllSearchHandlers } from './search'
export { registerStockNewsHandlers } from './news'

/**
 * 注册所有IPC handlers
 */
export function registerAllIpcHandlers() {
  const { registerAllStockHandlers } = require('./stock')
  const { registerAllFundHandlers } = require('./fund')
  const { registerAllFutureHandlers } = require('./future')
  const { registerAllQuoteHandlers } = require('./quotes')
  const { registerAllSearchHandlers } = require('./search')
  const { registerStockNewsHandlers } = require('./news')

  registerAllStockHandlers()
  registerAllFundHandlers()
  registerAllFutureHandlers()
  registerAllQuoteHandlers()
  registerAllSearchHandlers()
  registerStockNewsHandlers()
}

