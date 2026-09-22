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
]

export const PINNED_SYMBOL_SET = new Set(PINNED_SYMBOLS)

/**
 * What a brand-new user's favorites list starts out as (before they ever
 * toggle a star themselves). Once they save any favorites of their own,
 * that saved list takes over — see services/db.js getFavorites().
 */
export const DEFAULT_FAVORITE_SYMBOLS = ['price_dollar_rl', 'geram18', 'crypto-bitcoin-irr', 'ime_fund_ayar']
