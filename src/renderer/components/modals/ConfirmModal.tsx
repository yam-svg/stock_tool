import React from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle } from 'lucide-react'
import { Button } from '../../ui'

interface ConfirmModalProps {
  darkMode: boolean
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  darkMode,
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 只在点击背景时触发，不触发事件穿透
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  const handleModalClick = (e: React.MouseEvent) => {
    // 防止点击事件穿透到模态框下方的元素
    e.stopPropagation()
  }

  const modalContent = (
    <div 
      className="fixed left-0 right-0 top-0 bottom-0 z-[9999] bg-black/50 flex items-center justify-center"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div 
        className={`w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={handleModalClick}
        role="alertdialog"
        aria-modal="true"
      >
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className={`w-4 h-4 ${isDangerous ? 'text-red-500' : 'text-blue-500'}`} />
              <h3 className="text-base font-semibold">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="关闭"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {message}
          </p>
        </div>

        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onCancel()
              }}
              disabled={isSubmitting}
            >
              {cancelText}
            </Button>
            <Button
              variant={isDangerous ? 'danger' : 'primary'}
              isLoading={isSubmitting || isLoading}
              onClick={(e) => {
                e.stopPropagation()
                handleConfirm()
              }}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

