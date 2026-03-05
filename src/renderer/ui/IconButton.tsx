import React from 'react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'primary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  darkMode?: boolean
  icon: React.ReactNode
  tooltip?: string
  isLoading?: boolean
}

/**
 * IconButton - 图标按钮组件
 * 专门用于只包含图标的按钮场景（刷新、深色模式切换等）
 */
export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'default',
  size = 'md',
  darkMode = false,
  icon,
  tooltip,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // 基础样式
  const baseStyles = 'inline-flex items-center justify-center transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  // 变体样式
  const variantStyles = {
    default: darkMode
      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:shadow-md'
      : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200 hover:shadow-md',
    ghost: darkMode
      ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white border border-blue-600 hover:shadow-md',
    danger: 'bg-red-500 hover:bg-red-600 text-white border border-red-600 hover:shadow-md'
  }
  
  // 尺寸样式
  const sizeStyles = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  }

  const iconSizeClass = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      title={tooltip}
      {...props}
    >
      {isLoading ? (
        <svg className={`animate-spin ${iconSizeClass[size]}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <span className={iconSizeClass[size]}>{icon}</span>
      )}
    </button>
  )
}

