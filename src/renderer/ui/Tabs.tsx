import React from 'react'

interface TabsProps<T extends string = string> {
  activeTab: T
  onChange: (tab: T) => void
  tabs: Array<{
    id: T
    label: string
    icon?: React.ReactNode
  }>
  size?: 'sm' | 'md'
}

export type { TabsProps }

export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onChange,
  tabs,
  size = 'md'
}) => {
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs space-x-0.5',
    md: 'px-3 py-1.5 text-sm space-x-1'
  }
  
  return (
    <div className="flex space-x-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1 rounded font-medium transition-all duration-200 flex items-center space-x-1 ${sizeStyles[size]} ${
            activeTab === tab.id
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
