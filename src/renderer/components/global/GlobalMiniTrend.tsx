import React from 'react'
import { GlobalIndexTrendPoint } from '../../../shared/types'

interface GlobalMiniTrendProps {
  darkMode: boolean
  points?: GlobalIndexTrendPoint[]
  className?: string
}

export const GlobalMiniTrend: React.FC<GlobalMiniTrendProps> = ({ darkMode, points = [], className = '' }) => {
  const width = 120
  const height = 36

  const values = points.map((point) => point.value).filter((value) => Number.isFinite(value))
  const hasData = values.length >= 2

  if (!hasData) {
    return (
      <div
        className={`h-9 w-[120px] rounded border ${
          darkMode ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-gray-50'
        } ${className}`}
      >
        <div className={`h-full w-full flex items-center justify-center text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          当日暂无走势
        </div>
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const linePoints = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * (width - 2) + 1
      const y = height - 2 - ((value - min) / span) * (height - 4)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const up = values[values.length - 1] >= values[0]
  const stroke = up ? '#ef4444' : '#22c55e'
  const background = darkMode ? 'rgba(31,41,55,0.35)' : 'rgba(255,255,255,0.7)'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-9 w-[120px] rounded border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${className}`}
      style={{ background }}
      aria-label="当日迷你走势"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={linePoints}
      />
    </svg>
  )
}

