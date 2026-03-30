import React, { useEffect, useMemo, useState } from 'react'
import { X, Activity } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const electron = window.electronAPI.db

interface FutureIntradayPoint {
  time: string
  price: number
  volume: number
}

interface FutureChartModalProps {
  isOpen: boolean
  onClose: () => void
  symbol: string
  name: string
  darkMode: boolean
}

export const FutureChartModal: React.FC<FutureChartModalProps> = ({
  isOpen,
  onClose,
  symbol,
  name,
  darkMode,
}) => {
  const [data, setData] = useState<FutureIntradayPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yesterdayClose, setYesterdayClose] = useState(0)

  useEffect(() => {
    if (isOpen && symbol) {
      void fetchIntradayData()
    }
  }, [isOpen, symbol])

  const fetchIntradayData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await electron.getFutureIntraday(symbol)
      if (result.success && result.data) {
        setData(result.data.points)
        setYesterdayClose(result.data.yesterdayClose)
      } else {
        setError(result.error || '获取期货走势图失败')
      }
    } catch (err) {
      console.error('Error fetching future intraday:', err)
      setError('获取期货走势图失败')
    } finally {
      setLoading(false)
    }
  }

  const xAxisTicks = useMemo(() => {
    if (data.length === 0) return [] as string[]

    const times = data.map((item) => item.time)
    const targetTickCount = 16
    if (times.length <= targetTickCount) return times

    const ticks: string[] = []
    const step = (times.length - 1) / (targetTickCount - 1)
    for (let i = 0; i < targetTickCount; i += 1) {
      const index = Math.round(i * step)
      const value = times[index]
      if (value && !ticks.includes(value)) {
        ticks.push(value)
      }
    }

    const first = times[0]
    const last = times[times.length - 1]
    if (!ticks.includes(first)) ticks.unshift(first)
    if (!ticks.includes(last)) ticks.push(last)

    return ticks
  }, [data])

  if (!isOpen) return null

  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0
  const change = yesterdayClose > 0 ? currentPrice - yesterdayClose : 0
  const changePercent = yesterdayClose > 0 ? (change / yesterdayClose) * 100 : 0
  const isUp = change >= 0

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50" onClick={onClose}>
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
              <Activity className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{name}</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{symbol}</p>
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
          {!loading && !error && (
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className={`text-3xl font-bold ${isUp ? 'text-red-500' : 'text-green-500'}`}>
                  {currentPrice ? currentPrice.toFixed(3) : '-'}
                </div>
                <div className={`text-sm ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                  {isUp ? '+' : ''}
                  {change.toFixed(3)} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
                </div>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                昨结/昨收: {yesterdayClose > 0 ? yesterdayClose.toFixed(3) : '-'}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          {loading && (
            <div className="h-[420px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>加载走势图中...</div>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="h-[420px] flex items-center justify-center text-center">
              <div>
                <p className="text-red-500 mb-3">{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchIntradayData()}
                  className={`px-4 py-2 rounded-md ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 20, left: 6, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis
                    dataKey="time"
                    ticks={xAxisTicks}
                    stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 12 }}
                    minTickGap={6}
                  />
                  <YAxis
                    stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 12 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value: number) => value.toFixed(3)}
                    width={78}
                  />
                  <Tooltip
                    formatter={(value) => [Number(value || 0).toFixed(3), '价格']}
                    labelFormatter={(label) => `时间: ${String(label || '')}`}
                    cursor={{ stroke: darkMode ? '#6B7280' : '#9CA3AF', strokeWidth: 1 }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: darkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                      backgroundColor: darkMode ? '#111827' : '#FFFFFF',
                      color: darkMode ? '#F3F4F6' : '#111827',
                    }}
                  />
                  {yesterdayClose > 0 && (
                    <ReferenceLine y={yesterdayClose} stroke={darkMode ? '#6B7280' : '#9CA3AF'} strokeDasharray="3 3" />
                  )}
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isUp ? '#EF4444' : '#10B981'}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="h-[420px] flex items-center justify-center text-sm text-gray-500">暂无期货走势图数据</div>
          )}
        </div>
      </div>
    </div>
  )
}

