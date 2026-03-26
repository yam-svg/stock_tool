export interface FutureContractOption {
  symbol: string
  name: string
  market: 'CN' | 'INTL'
  aliases?: string[]
}

// 主流国内/国际期货合约（连续/主力代码），用于搜索与快速添加。
export const FUTURE_CONTRACTS: FutureContractOption[] = [
  { symbol: 'nf_IF0', name: '沪深300股指连续', market: 'CN', aliases: ['IF', 'CSI300'] },
  { symbol: 'nf_IH0', name: '上证50股指连续', market: 'CN', aliases: ['IH', 'SSE50'] },
  { symbol: 'nf_IC0', name: '中证500股指连续', market: 'CN', aliases: ['IC', 'CSI500'] },
  { symbol: 'nf_IM0', name: '中证1000股指连续', market: 'CN', aliases: ['IM', 'CSI1000'] },
  { symbol: 'nf_RB0', name: '螺纹钢连续', market: 'CN', aliases: ['RB', 'SHFE'] },
  { symbol: 'nf_HC0', name: '热轧卷板连续', market: 'CN', aliases: ['HC'] },
  { symbol: 'nf_I0', name: '铁矿石连续', market: 'CN', aliases: ['I', 'DCE'] },
  { symbol: 'nf_JM0', name: '焦煤连续', market: 'CN', aliases: ['JM'] },
  { symbol: 'nf_J0', name: '焦炭连续', market: 'CN', aliases: ['J'] },
  { symbol: 'nf_M0', name: '豆粕连续', market: 'CN', aliases: ['M'] },
  { symbol: 'nf_Y0', name: '豆油连续', market: 'CN', aliases: ['Y'] },
  { symbol: 'nf_P0', name: '棕榈油连续', market: 'CN', aliases: ['P'] },
  { symbol: 'nf_AU0', name: '沪金连续', market: 'CN', aliases: ['AU', '黄金'] },
  { symbol: 'nf_AG0', name: '沪银连续', market: 'CN', aliases: ['AG', '白银'] },
  { symbol: 'nf_CU0', name: '沪铜连续', market: 'CN', aliases: ['CU'] },
  { symbol: 'nf_AL0', name: '沪铝连续', market: 'CN', aliases: ['AL'] },
  { symbol: 'nf_ZN0', name: '沪锌连续', market: 'CN', aliases: ['ZN'] },
  { symbol: 'nf_SC0', name: '原油连续', market: 'CN', aliases: ['SC', 'INE'] },
  { symbol: 'nf_SR0', name: '白糖连续', market: 'CN', aliases: ['SR'] },
  { symbol: 'nf_CF0', name: '棉花连续', market: 'CN', aliases: ['CF'] },

  { symbol: 'hf_ES', name: '标普500期货', market: 'INTL', aliases: ['S&P', 'ES'] },
  { symbol: 'hf_NQ', name: '纳斯达克100期货', market: 'INTL', aliases: ['NASDAQ', 'NQ'] },
  { symbol: 'hf_YM', name: '道琼斯期货', market: 'INTL', aliases: ['Dow', 'YM'] },
  { symbol: 'hf_CL', name: '纽约原油期货', market: 'INTL', aliases: ['WTI', 'CL'] },
  { symbol: 'hf_OIL', name: '布伦特原油期货', market: 'INTL', aliases: ['Brent'] },
  { symbol: 'hf_GC', name: '纽约黄金期货', market: 'INTL', aliases: ['Gold', 'GC'] },
  { symbol: 'hf_SI', name: '纽约白银期货', market: 'INTL', aliases: ['Silver', 'SI'] },
  { symbol: 'hf_HG', name: '纽约铜期货', market: 'INTL', aliases: ['Copper', 'HG'] },
  { symbol: 'hf_NK225', name: '日经225期货', market: 'INTL', aliases: ['Nikkei'] },
  { symbol: 'hf_HSI', name: '恒生指数期货', market: 'INTL', aliases: ['HSI', 'Hang Seng'] },
]

