import React from 'react'
import { PieChart } from 'lucide-react'

interface FundViewProps {
  darkMode: boolean
}

export const FundView: React.FC<FundViewProps> = ({ darkMode }) => {
  return (
    <div className="text-center py-12">
      <div className={`inline-flex p-4 rounded-full mb-4 ${
        darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
      }`}>
        <PieChart className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">基金功能开发中</h3>
      <p className={`text-sm ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>敬请期待更多功能</p>
    </div>
  )
}
