import { FutureQuote } from '../../shared/types'

export const normalizeFutureSymbol = (raw: string) => {
  const value = String(raw || '').trim()
  if (!value) return ''

  if (value.startsWith('nf_') || value.startsWith('hf_')) {
    const [prefix, body] = value.split('_')
    return `${prefix.toLowerCase()}_${(body || '').toUpperCase()}`
  }

  return `nf_${value.toUpperCase()}`
}

export const getFutureQuote = (quotes: Record<string, FutureQuote>, symbol: string): FutureQuote | undefined => {
  const normalized = normalizeFutureSymbol(symbol)
  return quotes[symbol] || quotes[normalized] || quotes[normalized.toLowerCase()] || quotes[normalized.toUpperCase()]
}


