import React, { useEffect, useState } from 'react'
import { X, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const electron = window.electronAPI.db

interface IntradayData {
  time: string
  price: number
  volume: number
}

interface StockChartModalProps {
  isOpen: boolean
  onClose: () => void
  symbol: string
  name: string
  darkMode: boolean
}

export const StockChartModal: React.FC<StockChartModalProps> = ({
  isOpen,
  onClose,
  symbol,
  name,
  darkMode,
}) => {
  const [data, setData] = useState<IntradayData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yesterdayClose, setYesterdayClose] = useState<number>(0)

  useEffect(() => {
    if (isOpen && symbol) {
      fetchIntradayData()
    }
  }, [isOpen, symbol])

  const fetchIntradayData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await electron.getStockIntraday(symbol)
      console.log(result)
      if (result.success && result.data) {
        setData(result.data.points)
        setYesterdayClose(result.data.yesterdayClose)
      } else {
        setError(result.error || '获取数据失败')
      }
    } catch (err) {
      setError('获取数据失败')
      console.error('Error fetching intraday data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const currentPrice = data.length > 0 ? data[data.length - 1].price : yesterdayClose
  const change = currentPrice - yesterdayClose
  const changePercent = yesterdayClose !== 0 ? (change / yesterdayClose) * 100 : 0
  const isUp = change >= 0

  // 将时间字符串转换为分钟数（用于比较）
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  // 优化 X 轴刻度，显示关键时间点
  const getXAxisTicks = () => {
    if (data.length === 0) return []
    
    const times = data.map(d => d.time)
    const ticks: string[] = []
    
    // 关键时间点：开盘、午休前、午休后
    const keyTimes = ['09:30', '11:30', '13:00']
    
    keyTimes.forEach(keyTime => {
      // 找到最接近的时间点
      let closest = times[0]
      let minDiff = Math.abs(timeToMinutes(times[0]) - timeToMinutes(keyTime))
      
      for (const time of times) {
        const diff = Math.abs(timeToMinutes(time) - timeToMinutes(keyTime))
        if (diff < minDiff) {
          minDiff = diff
          closest = time
        }
      }
      
      if (closest && !ticks.includes(closest)) {
        ticks.push(closest)
      }
    })
    
    // 始终添加最后一个时间点（当前最新时间或收盘时间）
    const lastTime = times[times.length - 1]
    if (!ticks.includes(lastTime)) {
      ticks.push(lastTime)
    }
    
    return ticks
  }

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const priceChange = data.price - yesterdayClose
      const priceChangePercent = yesterdayClose !== 0 ? (priceChange / yesterdayClose) * 100 : 0
      const isPriceUp = priceChange >= 0

      return (
        <div
          className={`px-3 py-2 rounded-lg shadow-lg ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="text-sm font-medium mb-1">{data.time}</div>
          <div className={`text-lg font-bold ${isPriceUp ? 'text-red-500' : 'text-green-500'}`}>
            ¥{data.price.toFixed(2)}
          </div>
          <div className={`text-xs ${isPriceUp ? 'text-red-400' : 'text-green-400'}`}>
            {isPriceUp ? '+' : ''}{priceChange.toFixed(2)} ({isPriceUp ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl mx-4 rounded-2xl shadow-2xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-2 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                darkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
              }`}
            >
              <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{name}</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {symbol}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>加载中...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <button
                  onClick={fetchIntradayData}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  重试
                </button>
              </div>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <>
              {/* 当前价格信息 */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className={`text-4xl font-bold ${isUp ? 'text-red-500' : 'text-green-500'}`}>
                    ¥{currentPrice.toFixed(2)}
                  </div>
                  <div className={`text-lg ${isUp ? 'text-red-400' : 'text-green-400'}`}>
                    {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
                  </div>
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  昨收: ¥{yesterdayClose.toFixed(2)}
                </div>
              </div>

              {/* 走势图 */}
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={darkMode ? '#374151' : '#E5E7EB'}
                  />
                  <XAxis
                    dataKey="time"
                    stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 12 }}
                    ticks={getXAxisTicks()}
                  />
                  <YAxis
                    stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 12 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `¥${value.toFixed(2)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={yesterdayClose}
                    stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                    strokeDasharray="3 3"
                    label={{
                      value: '昨收',
                      position: 'right',
                      fill: darkMode ? '#9CA3AF' : '#6B7280',
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isUp ? '#EF4444' : '#10B981'}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* 统计信息 */}
              <div
                className={`mt-6 grid grid-cols-4 gap-4 p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}
              >
                <div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    最高
                  </div>
                  <div className="text-sm font-bold text-red-500">
                    ¥{Math.max(...data.map((d) => d.price)).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    最低
                  </div>
                  <div className="text-sm font-bold text-green-500">
                    ¥{Math.min(...data.map((d) => d.price)).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    今开
                  </div>
                  <div className="text-sm font-bold">
                    ¥{data[0].price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    成交量
                  </div>
                  <div className="text-sm font-bold">
                    {(data.reduce((sum, d) => sum + d.volume, 0) / 10000).toFixed(2)}万手
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="flex items-center justify-center h-96">
              <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>暂无数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

