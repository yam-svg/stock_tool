import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  label?: string
  darkMode?: boolean
}

export type { ToggleProps }

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  darkMode = false
}) => {
  const sizeStyles = {
    sm: 'h-3 w-5',
    md: 'h-4 w-7'
  }
  
  const thumbSizeStyles = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3'
  }
  
  const translateStyles = {
    sm: checked ? 'translate-x-2' : 'translate-x-0.5',
    md: checked ? 'translate-x-3' : 'translate-x-0.5'
  }
  
  return (
    <div className="flex items-center space-x-2">
      {label && (
        <span className={`text-xs font-medium ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {label}
        </span>
      )}
      
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        } ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`${thumbSizeStyles[size]} transform rounded-full bg-white shadow-sm transition-transform duration-200 ${translateStyles[size]}`}
        />
      </button>
    </div>
  )
}
