import React, { useEffect, useState } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Button, IconButton, Input } from '../../ui'
import FutureService from '../../services/futureService'
import { FutureGroup, FutureSearchResult } from '../../../shared/types'

interface SearchFutureModalProps {
  darkMode: boolean
  isOpen: boolean
  onClose: () => void
  group?: FutureGroup
  onSubmit: (data: { code: string; name: string; buyPrice: number; quantity: number; groupId: string; market?: 'CN' | 'INTL' }) => void
  isSubmitting?: boolean
}

export const SearchFutureModal: React.FC<SearchFutureModalProps> = ({
  darkMode,
  isOpen,
  onClose,
  group,
  onSubmit,
  isSubmitting,
}) => {
  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<FutureSearchResult[]>([])
  const [selectedFuture, setSelectedFuture] = useState<FutureSearchResult | null>(null)
  const [buyPrice, setBuyPrice] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setKeyword('')
    setSearchResults([])
    setSelectedFuture(null)
    setBuyPrice(0)
    setQuantity(0)
    setErrors({})
  }, [isOpen])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!keyword.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await FutureService.searchFutures(keyword)
        setSearchResults(results)
      } catch (error) {
        console.error('搜索期货失败:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [keyword])

  if (!isOpen) return null

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}
    if (!selectedFuture) newErrors.future = '请选择一个期货合约'
    if (buyPrice && buyPrice <= 0) newErrors.buyPrice = '开仓价格必须大于0'
    if (quantity && quantity <= 0) newErrors.quantity = '持仓手数必须大于0'
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) return

    if (selectedFuture && group) {
      onSubmit({
        code: selectedFuture.symbol,
        name: selectedFuture.name,
        buyPrice,
        quantity,
        groupId: group.id,
        market: selectedFuture.market,
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
              <h3 className="text-base font-semibold">搜索并添加期货</h3>
            </div>
            <IconButton onClick={onClose} darkMode={darkMode} variant="ghost" icon={<X />} size="sm" tooltip="关闭" />
          </div>
          {group && <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>目标分组：{group.name}</div>}
        </div>

        <div className="px-6 py-4 space-y-3">
          <Input
            label="搜索期货代码/名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="如 nf_RB0 / 纽约原油"
            darkMode={darkMode}
            leftElement={<Search className="w-4 h-4 text-gray-400" />}
            rightElement={
              isSearching ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" /> : null
            }
          />

          {searchResults.length > 0 && (
            <div className={`max-h-40 overflow-y-auto border rounded-md ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {searchResults.map((future) => (
                <button
                  key={future.symbol}
                  onClick={() => {
                    setSelectedFuture(future)
                    setKeyword(future.symbol)
                    setSearchResults([])
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  } ${selectedFuture?.symbol === future.symbol ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                >
                  {future.name} ({future.symbol})
                </button>
              ))}
            </div>
          )}
          {errors.future && <p className="text-red-500 text-xs mt-1">{errors.future}</p>}

          {selectedFuture && (
            <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
              <p className="text-sm font-medium">
                {selectedFuture.name} ({selectedFuture.symbol})
              </p>
              <p className="text-xs text-gray-500 mt-1">市场：{selectedFuture.market === 'CN' ? '国内' : '国际'}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="开仓价格"
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              darkMode={darkMode}
              error={errors.buyPrice}
              disabled={!selectedFuture}
            />
            <Input
              label="持仓手数"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              placeholder="1"
              darkMode={darkMode}
              error={errors.quantity}
              disabled={!selectedFuture}
            />
          </div>
        </div>

        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="success"
              isLoading={!!isSubmitting}
              onClick={handleSubmit}
              leftIcon={<Plus className="w-4 h-4" />}
              disabled={!selectedFuture}
            >
              确认添加
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

