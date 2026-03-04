import React from 'react'
import { X, Plus } from 'lucide-react'
import { Input, Button } from '../../ui'

interface Group {
  id: string
  name: string
}

interface AddStockModalProps {
  darkMode: boolean
  isOpen: boolean
  onClose: () => void
  group?: Group
  type: 'stock' | 'fund'
  onSubmit: (data: { code: string; name: string; buyPrice: number; quantity: number }) => void
  isSubmitting?: boolean
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  darkMode,
  isOpen,
  onClose,
  group,
  type,
  onSubmit,
  isSubmitting
}) => {
  const [code, setCode] = React.useState('')
  const [name, setName] = React.useState('')
  const [buyPrice, setBuyPrice] = React.useState<number>(0)
  const [quantity, setQuantity] = React.useState<number>(0)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (isOpen) {
      setCode('')
      setName('')
      setBuyPrice(0)
      setQuantity(0)
      setErrors({})
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}
    if (!code.trim()) newErrors.code = `请输入${type === 'stock' ? '股票' : '基金'}代码`
    if (!name.trim()) newErrors.name = `请输入${type === 'stock' ? '股票' : '基金'}名称`
    if (buyPrice < 0) newErrors.buyPrice = `${type === 'stock' ? '买入价格' : '单位成本'}不能为负数`
    if (quantity < 0) newErrors.quantity = `${type === 'stock' ? '持仓数量' : '持有份额'}不能为负数`
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    onSubmit({ code: code.trim(), name: name.trim(), buyPrice, quantity })
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
              <Plus className="w-4 h-4 text-blue-500" />
              <h3 className="text-base font-semibold">添加到分组</h3>
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
          <Input
            label={type === 'stock' ? '股票代码' : '基金代码'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={type === 'stock' ? '如 600519' : '如 000001'}
            darkMode={darkMode}
            error={errors.code}
          />
          <Input
            label={type === 'stock' ? '股票名称' : '基金名称'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'stock' ? '如 贵州茅台' : '如 华夏成长混合'}
            darkMode={darkMode}
            error={errors.name}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={type === 'stock' ? '买入价格' : '单位成本'}
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              darkMode={darkMode}
              error={errors.buyPrice}
            />
            <Input
              label={type === 'stock' ? '持仓数量' : '持有份额'}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="100"
              darkMode={darkMode}
              error={errors.quantity}
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
            >
              确认添加
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
