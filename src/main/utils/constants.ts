type GlobalIndexConfig = {
  symbol: string
  code: string
  nameEn: string
  nameCn: string
  market: string
  timezone: string
}

/**
 * 市场代码映射表
 */
export const marketMap = {
  US: '美国',
  CN: '中国',
  HK: '中国香港',
  TW: '中国台湾',
  JP: '日本',
  KR: '韩国',
  SG: '新加坡',
  UK: '英国',
  DE: '德国',
  FR: '法国',
  AU: '澳大利亚',
  CA: '加拿大',
  IN: '印度',
  BR: '巴西',
  RU: '俄罗斯',
}

export const GLOBAL_INDEXES: GlobalIndexConfig[] = [
  // 美股
  { symbol: '^GSPC', code: 'SPX', nameEn: 'S&P 500', nameCn: '标普500', market: 'US', timezone: 'America/New_York' },
  { symbol: '^DJI', code: 'DJI', nameEn: 'Dow Jones', nameCn: '道琼斯', market: 'US', timezone: 'America/New_York' },
  { symbol: '^IXIC', code: 'IXIC', nameEn: 'NASDAQ', nameCn: '纳斯达克', market: 'US', timezone: 'America/New_York' },
  // 亚太
  { symbol: '^N225', code: 'N225', nameEn: 'Nikkei 225', nameCn: '日经225', market: 'JP', timezone: 'Asia/Tokyo' },
  { symbol: '^KS11', code: 'KOSPI', nameEn: 'KOSPI', nameCn: '韩国综合指数', market: 'KR', timezone: 'Asia/Seoul' },
  { symbol: '^HSI', code: 'HSI', nameEn: 'Hang Seng', nameCn: '恒生指数', market: 'HK', timezone: 'Asia/Hong_Kong' },
  // 中国
  { symbol: '000001.SS', code: 'SSE', nameEn: 'SSE Composite', nameCn: '上证指数', market: 'CN', timezone: 'Asia/Shanghai' },
  { symbol: '399001.SZ', code: 'SZSE', nameEn: 'SZSE Component', nameCn: '深证成指', market: 'CN', timezone: 'Asia/Shanghai' },
  { symbol: '000300.SS', code: 'CSI300', nameEn: 'CSI 300', nameCn: '沪深300', market: 'CN', timezone: 'Asia/Shanghai' },
]

// ==== 新浪 symbol 映射（接口请求用） ====
export const SINA_SYMBOL_MAP: Record<string, string> = {
  '^DJI': 'gb_dji',
  '^IXIC': 'gb_ixic',
  '^GSPC': 'gb_$inx',
  '^N225': 'gb_nky',
  '^HSI': 'rt_hkHSI',
  '000001.SS': 'sh000001',
  '399001.SZ': 'sz399001',
  '000300.SS': 'sh000300',
  '^FTSE': 'gb_ftse',
  '^GDAXI': 'gb_dax',
}

// twelvedata API token
export const API_TOKEN = "0ca4632e3baa4de9b4adf04161504a39"
