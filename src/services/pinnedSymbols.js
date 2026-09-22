/**
 * The fixed set of assets rendered immediately on first paint (no network
 * wait, hydrated straight from IndexedDB cache) for each category. Users
 * can reveal the rest of a category with its own "show more" toggle.
 */
export const PINNED_SYMBOLS = [
  'geram18',
  'geram24',
  'price_dollar_rl',
  'price_eur',
  'price_gbp',
  'price_aed',
  'sekee',
  'sekeb',
  'crypto-bitcoin-irr',
  'crypto-tether-irr',
  'crypto-ethereum-irr',
  'crypto-cardano-irr',
  'ons',
  'silver',
  'palladium',
  'platinum',
  'ime_fund_ayar',
  'ime_fund_mesghal',
  'ime_fund_simin',
  'ime_fund_silver',
]

export const PINNED_SYMBOL_SET = new Set(PINNED_SYMBOLS)
export const DEFAULT_FAVORITE_SYMBOLS = ['price_dollar_rl', 'geram18', 'crypto-bitcoin-irr', 'ime_fund_ayar']
