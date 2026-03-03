import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  darkMode?: boolean
}

export type { InputProps }

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftElement,
  rightElement,
  darkMode = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.replace(/\s+/g, '-').toLowerCase()
  
  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className={`text-xs font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative rounded-md">
        {leftElement && (
          <div className="absolute left-0 top-0 h-full flex items-center pl-3 pointer-events-none">
            {leftElement}
          </div>
        )}
        
        <input
          id={inputId}
          className={`w-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            leftElement ? 'pl-9' : ''
          } ${
            rightElement ? 'pr-9' : ''
          } ${
            darkMode 
              ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white/50 border-gray-200 text-gray-800 placeholder-gray-500'
          } border ${className}`}
          {...props}
        />
        
        {rightElement && (
          <div className="absolute right-0 top-0 h-full flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
