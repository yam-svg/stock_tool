import { X, ExternalLink, Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import NewsService from '../../services/newsService'

interface ArticleReaderModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url: string
  darkMode: boolean
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
  darkMode,
}) => {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadContent = async () => {
      setLoading(true)
      setError(null)
      setContent('')

      try {
        const result = await NewsService.getArticleContent(url)
        if (result.success && result.data) {
          setContent(result.data.html)
        } else {
          setError(result.error || '无法获取文章内容')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载文章内容失败')
      } finally {
        setLoading(false)
      }
    }

    void loadContent()
  }, [isOpen, url])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`relative h-[90vh] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col ${
          darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold line-clamp-2">{title}</h2>
            <p className={`text-sm mt-1 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{url}</p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2 ml-4">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              title="在浏览器中打开原文"
            >
              <ExternalLink className="w-5 h-5" />
            </a>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>正在加载文章内容...</p>
            </div>
          )}

          {error && !loading && (
            <div
              className={`rounded-lg p-6 text-center ${
                darkMode ? 'bg-red-950/30 border border-red-900/50 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <p className="mb-4">{error}</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-red-900/30 hover:bg-red-900/40 text-red-300'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
              >
                在浏览器中打开
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {!loading && !error && content && (
            <div
              className={`prose prose-sm ${darkMode ? 'prose-invert' : ''} max-w-none`}
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

