import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  darkMode?: boolean
  hoverable?: boolean
  onClick?: () => void
}

export type { CardProps }

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  darkMode = false,
  hoverable = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 backdrop-blur-sm transition-all duration-200 ${
        darkMode 
          ? 'bg-gray-800/50 border border-gray-700/50' 
          : 'bg-white/50 border border-gray-200/50'
      } ${
        hoverable ? 'hover:shadow-md cursor-pointer' : 'shadow-sm'
      } ${className}`}
    >
      {children}
    </div>
  )
}
