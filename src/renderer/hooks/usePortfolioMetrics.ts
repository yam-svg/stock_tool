import { useMemo } from 'react'
import { UsePortfolioMetricsParams } from '../types/hooks'
import { isSystemFundGroup, isSystemStockGroup } from '../../shared/groupConstants'

export function usePortfolioMetrics({
  activeTab,
  stocks,
  stockQuotes,
  funds,
  fundQuotes,
  selectedStockGroup,
  stockGroups,
  fundGroups,
}: UsePortfolioMetricsParams) {
  // 股票总收益：基于实时价与成本价差额汇总。
  const stockProfit = useMemo(
    () =>
      stocks.reduce((acc, stock) => {
        const quote = stockQuotes[stock.symbol]
        const currentPrice = quote?.price || 0
        const cost = stock.costPrice * stock.quantity
        const marketValue = currentPrice * stock.quantity
        return acc + (marketValue - cost)
      }, 0),
    [stocks, stockQuotes],
  )

  // 基金总收益：基于实时净值与持仓成本差额汇总。
  const fundProfit = useMemo(
    () =>
      funds.reduce((acc, fund) => {
        const quote = fundQuotes[fund.code]
        const currentNav = quote?.nav || 0
        const cost = fund.costNav * fund.shares
        const marketValue = currentNav * fund.shares
        return acc + (marketValue - cost)
      }, 0),
    [funds, fundQuotes],
  )

  // 当前选中股票分组下的可见列表。
  const visibleStocks = useMemo(
    () => {
      if (!selectedStockGroup) return []
      if (isSystemStockGroup(selectedStockGroup)) return stocks
      return stocks.filter((s) => s.groupId === selectedStockGroup)
    },
    [stocks, selectedStockGroup],
  )

  // Sidebar 展示用数量映射：按当前 tab 选择股票或基金计数。
  const groupCounts = useMemo(() => {
    if (activeTab === 'stock') {
      return stockGroups.reduce((acc, group) => {
        acc[group.id] = isSystemStockGroup(group.id) ? stocks.length : stocks.filter((s) => s.groupId === group.id).length
        return acc
      }, {} as Record<string, number>)
    }

    return fundGroups.reduce((acc, group) => {
      acc[group.id] = isSystemFundGroup(group.id) ? funds.length : funds.filter((f) => f.groupId === group.id).length
      return acc
    }, {} as Record<string, number>)
  }, [activeTab, stockGroups, fundGroups, stocks, funds])

  return {
    stockProfit,
    fundProfit,
    visibleStocks,
    groupCounts,
  }
}
