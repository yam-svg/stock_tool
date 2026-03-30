import React, { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { CandlestickData, CandlestickSeries, Time, createChart } from 'lightweight-charts'
import { TrendingUp, X } from 'lucide-react'
import { GlobalIndexQuote, GlobalIndexTrendData, GlobalTrendPeriod } from '../../../shared/types'

const electron = window.electronAPI.db

interface GlobalIndexTrendModalProps {
  isOpen: boolean
  onClose: () => void
  darkMode: boolean
  index: GlobalIndexQuote | null
}

const PERIOD_OPTIONS: Array<{ key: GlobalTrendPeriod; label: string }> = [
  { key: 'today', label: '今天' },
  { key: 'history', label: '历史' },
]

const formatXAxisTime = (value: number, period: GlobalTrendPeriod) => {
  const time = new Date(value)
  const month = time.getMonth() + 1
  const day = time.getDate()
  const hour = String(time.getHours()).padStart(2, '0')
  const minute = String(time.getMinutes()).padStart(2, '0')

  if (period === 'today') return `${hour}:${minute}`
  if (period === 'history') return `${time.getFullYear()}/${month}`
  return `${month}/${day} ${hour}:${minute}`
}

const formatTooltipTime = (value: number, period: GlobalTrendPeriod) => {
  const time = new Date(value)
  const month = time.getMonth() + 1
  const day = time.getDate()
  const hour = String(time.getHours()).padStart(2, '0')
  const minute = String(time.getMinutes()).padStart(2, '0')

  if (period === 'history') return `${time.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return `${time.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${hour}:${minute}`
}

const getTargetTickCount = (period: GlobalTrendPeriod) => {
  if (period === 'today') return 10
  return 8
}

interface HistoryCandlestickChartProps {
  points: GlobalIndexTrendData['points']
  darkMode: boolean
  previousClose: number
}

const HistoryCandlestickChart: React.FC<HistoryCandlestickChartProps> = ({ points, darkMode, previousClose }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  const candleData = useMemo(
    () => points
      .filter(
        (point) =>
          Number.isFinite(point.open) &&
          Number.isFinite(point.high) &&
          Number.isFinite(point.low) &&
          Number.isFinite(point.close),
      )
      .map(
        (point) => ({
          time: Math.floor(point.timestamp / 1000) as Time,
          open: Number(point.open),
          high: Number(point.high),
          low: Number(point.low),
          close: Number(point.close),
        } satisfies CandlestickData<Time>),
      ),
    [points],
  )

  useEffect(() => {
    const element = containerRef.current
    if (!element || candleData.length === 0) return

    const chart = createChart(element, {
      autoSize: true,
      layout: {
        background: { color: darkMode ? '#1f2937' : '#ffffff' },
        textColor: darkMode ? '#d1d5db' : '#6b7280',
      },
      grid: {
        vertLines: { color: darkMode ? '#374151' : '#e5e7eb' },
        horzLines: { color: darkMode ? '#374151' : '#e5e7eb' },
      },
      rightPriceScale: {
        borderColor: darkMode ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: darkMode ? '#4b5563' : '#d1d5db',
        timeVisible: true,
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#ef4444',
      downColor: '#10b981',
      borderVisible: false,
      wickUpColor: '#ef4444',
      wickDownColor: '#10b981',
    })

    series.setData(candleData)

    if (Number.isFinite(previousClose) && previousClose > 0) {
      series.createPriceLine({
        price: previousClose,
        color: darkMode ? '#9ca3af' : '#6b7280',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '昨收',
      })
    }

    chart.timeScale().fitContent()

    return () => {
      chart.remove()
    }
  }, [candleData, darkMode, previousClose])

  if (candleData.length === 0) {
    return <div className="h-[420px] flex items-center justify-center text-sm text-gray-500">历史数据暂不支持K线显示</div>
  }

  return <div ref={containerRef} className="h-[420px] w-full" />
}

export const GlobalIndexTrendModal: React.FC<GlobalIndexTrendModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  index,
}) => {
  const [period, setPeriod] = useState<GlobalTrendPeriod>('today')
  const [historyChartType, setHistoryChartType] = useState<'line' | 'candlestick'>('line')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trendData, setTrendData] = useState<GlobalIndexTrendData | null>(null)

  useEffect(() => {
    if (!isOpen || !index?.symbol) return
    void fetchTrendData(index.symbol, period)
  }, [isOpen, index?.symbol, period])

  useEffect(() => {
    if (!isOpen) {
      setPeriod('today')
      setHistoryChartType('line')
      setError(null)
      setTrendData(null)
    }
  }, [isOpen])

  const fetchTrendData = async (symbol: string, selectedPeriod: GlobalTrendPeriod) => {
    setLoading(true)
    setError(null)

    try {
      const result = await electron.getGlobalIndexTrend(symbol, selectedPeriod)
      if (!result.success || !result.data) {
        setError(result.error || '获取走势失败')
        setTrendData(null)
        return
      }
      setTrendData(result.data)
    } catch (err) {
      console.error('Fetch global trend failed:', err)
      setError('获取走势失败')
      setTrendData(null)
    } finally {
      setLoading(false)
    }
  }

  const latestValue = useMemo(() => {
    if (!trendData || trendData.points.length === 0) return 0
    return trendData.points[trendData.points.length - 1].value
  }, [trendData])

  const xAxisTicks = useMemo(() => {
    if (!trendData || trendData.points.length === 0) return [] as number[]

    const timestamps = trendData.points.map((point) => point.timestamp)
    const total = timestamps.length
    const targetCount = getTargetTickCount(period)

    if (total <= targetCount) return timestamps

    const ticks: number[] = []
    const step = (total - 1) / (targetCount - 1)
    for (let i = 0; i < targetCount; i += 1) {
      const index = Math.round(i * step)
      const ts = timestamps[index]
      if (Number.isFinite(ts) && !ticks.includes(ts)) {
        ticks.push(ts)
      }
    }

    const first = timestamps[0]
    const last = timestamps[total - 1]
    if (!ticks.includes(first)) ticks.unshift(first)
    if (!ticks.includes(last)) ticks.push(last)

    ticks.sort((a, b) => a - b)
    return ticks
  }, [trendData, period])

  const change = latestValue - (trendData?.previousClose || 0)
  const changePercent = trendData?.previousClose
    ? (change / trendData.previousClose) * 100
    : 0

  const renderTooltip = (props: any) => {
    const { active, payload, label } = props
    if (!active || !payload || payload.length === 0 || !trendData) return null

    const pointValue = Number(payload[0]?.value || 0)
    const pointChangePercent = trendData.previousClose > 0
      ? ((pointValue - trendData.previousClose) / trendData.previousClose) * 100
      : 0
    const isUp = pointChangePercent >= 0

    return (
      <div
        className={`px-3 py-2 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
      >
        <div className={`text-xs mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          时间: {formatTooltipTime(Number(label || 0), period)}
        </div>
        <div className="text-sm font-semibold">指数: {pointValue.toFixed(2)}</div>
        <div className={`text-xs font-medium ${isUp ? 'text-red-500' : 'text-green-500'}`}>
          涨跌幅: {isUp ? '+' : ''}{pointChangePercent.toFixed(2)}%
        </div>
      </div>
    )
  }

  if (!isOpen || !index) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl mx-4 rounded-2xl shadow-2xl ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between px-6 py-3 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`${darkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'} p-2 rounded-lg`}>
              <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{index.name}</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{index.code}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setPeriod(option.key)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  option.key === period
                    ? 'bg-blue-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}

            {period === 'history' && (
              <>
                <button
                  type="button"
                  onClick={() => setHistoryChartType('line')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    historyChartType === 'line'
                      ? 'bg-indigo-500 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  折线图
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryChartType('candlestick')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    historyChartType === 'candlestick'
                      ? 'bg-indigo-500 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  K线图
                </button>
              </>
            )}
          </div>

          {!loading && !error && trendData && (
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className={`text-3xl font-bold ${change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {latestValue.toFixed(2)}
                </div>
                <div className={`text-sm ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)} ({change >= 0 ? '+' : ''}
                  {changePercent.toFixed(2)}%)
                </div>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                昨收: {trendData.previousClose.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          {loading && (
            <div className="h-[420px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>加载走势中...</div>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="h-[420px] flex items-center justify-center text-center">
              <div>
                <p className="text-red-500 mb-3">{error}</p>
                <button
                  type="button"
                  onClick={() => index?.symbol && fetchTrendData(index.symbol, period)}
                  className={`px-4 py-2 rounded-md ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {!loading && !error && trendData && trendData.points.length > 0 && (
            period === 'history' && historyChartType === 'candlestick' ? (
              <HistoryCandlestickChart
                points={trendData.points}
                darkMode={darkMode}
                previousClose={trendData.previousClose}
              />
            ) : (
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.points} margin={{ top: 10, right: 20, left: 6, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      ticks={xAxisTicks}
                      stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatXAxisTime(Number(value), period)}
                      minTickGap={8}
                    />
                    <YAxis
                      stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                      tick={{ fontSize: 12 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value: number) => value.toFixed(2)}
                      width={72}
                    />
                    <Tooltip
                      content={renderTooltip}
                      cursor={{ stroke: darkMode ? '#6B7280' : '#9CA3AF', strokeWidth: 1 }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: darkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                        backgroundColor: darkMode ? '#111827' : '#FFFFFF',
                        color: darkMode ? '#F3F4F6' : '#111827',
                      }}
                    />
                    <ReferenceLine
                      y={trendData.previousClose}
                      stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                      strokeDasharray="3 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={change >= 0 ? '#EF4444' : '#10B981'}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

