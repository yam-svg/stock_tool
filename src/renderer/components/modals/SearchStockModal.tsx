import React, { useState, useEffect } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { Input, Button } from '../../ui'
import StockService from '../../services/stockService'
import { StockSearchResult, StockGroup } from '../../../shared/types'

interface SearchStockModalProps {
  darkMode: boolean
  isOpen: boolean
  onClose: () => void
  group?: StockGroup
  onSubmit: (data: { code: string; name: string; buyPrice: number; quantity: number; groupId: string }) => void
  isSubmitting?: boolean
}

export const SearchStockModal: React.FC<SearchStockModalProps> = ({
  darkMode,
  isOpen,
  onClose,
  group,
  onSubmit,
  isSubmitting
}) => {
  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null)
  const [buyPrice, setBuyPrice] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setKeyword('')
      setSearchResults([])
      setSelectedStock(null)
      setBuyPrice(0)
      setQuantity(0)
      setErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (keyword.trim()) {
        setIsSearching(true)
        try {
          const results = await StockService.searchStocks(keyword)
          console.log(results)
          setSearchResults(results)
        } catch (error) {
          console.error('搜索股票失败:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500) // 500ms 防抖

    return () => clearTimeout(delaySearch)
  }, [keyword])

  if (!isOpen) return null

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}
    if (!selectedStock) newErrors.stock = '请选择一支股票'
    if (buyPrice && buyPrice <= 0) newErrors.buyPrice = '买入价格必须大于0'
    if (quantity && quantity <= 0) newErrors.quantity = '持仓数量必须大于0'
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) return

    if (selectedStock && group) {
      onSubmit({
        code: selectedStock.symbol,
        name: selectedStock.name,
        buyPrice,
        quantity,
        groupId: group.id
      })
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className={`relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-500" />
              <h3 className="text-base font-semibold">搜索并添加股票</h3>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {group && (
            <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              目标分组：{group.name}
            </div>
          )}
        </div>

        <div className="px-6 py-4 space-y-3">
          {/* 搜索输入框 */}
          <Input
            label="搜索股票代码/名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="如 贵州茅台 或 600519"
            darkMode={darkMode}
            leftElement={<Search className="w-4 h-4 text-gray-400" />}
            rightElement={isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            ) : null}
          />

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className={`max-h-40 overflow-y-auto border rounded-md ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {searchResults.map(stock => (
                <button
                  key={stock.symbol + stock.name}
                  onClick={() => {
                    setSelectedStock(stock)
                    setKeyword(stock.symbol)
                    setSearchResults([])
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } ${selectedStock?.symbol === stock.symbol ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                >
                  {stock.name} ({stock.symbol})
                </button>
              ))}
            </div>
          )}
          {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}

          {/* 选中的股票信息 */}
          {selectedStock && (
            <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
              <p className="text-sm font-medium">{selectedStock.name} ({selectedStock.symbol})</p>
            </div>
          )}

          {/* 买入价格和数量 */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="买入价格"
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              darkMode={darkMode}
              error={errors.buyPrice}
              disabled={!selectedStock}
            />
            <Input
              label="持仓数量"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="100"
              darkMode={darkMode}
              error={errors.quantity}
              disabled={!selectedStock}
            />
          </div>
        </div>

        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              variant="success"
              isLoading={!!isSubmitting}
              onClick={handleSubmit}
              leftIcon={<Plus className="w-4 h-4" />}
              disabled={!selectedStock}
            >
              确认添加
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
