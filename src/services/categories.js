/**
 * Infrastructure: category resolver + presentation metadata (color/icon).
 * Buckets a raw TGJU-style symbol key into one of the app's display
 * categories purely from its key shape (prefix / known-name match).
 * Kept isomorphic (no browser/Node API) so both the client and the
 * server-side fetch script can share it.
 */

export const CATEGORY = Object.freeze({
  CURRENCY: 'currency',
  GOLD_COIN: 'gold',
  OTHER_METALS: 'metals',
  CRYPTO: 'crypto',
  GLOBAL_INDEX: 'index',
  FUND: 'fund',
  OTHER: 'other',
})

export const CATEGORY_LABELS = {
  [CATEGORY.CURRENCY]: 'ارز',
  [CATEGORY.GOLD_COIN]: 'طلا و سکه',
  [CATEGORY.OTHER_METALS]: 'سایر فلزات جهانی',
  [CATEGORY.CRYPTO]: 'رمزارز',
  [CATEGORY.GLOBAL_INDEX]: 'شاخص و کامودیتی جهانی',
  [CATEGORY.FUND]: 'صندوق‌های کالایی',
  [CATEGORY.OTHER]: 'سایر',
}

/** Accent color per category, used for the card's top border and icon chip. */
export const CATEGORY_COLORS = {
  [CATEGORY.CURRENCY]: '#4a89ff',
  [CATEGORY.GOLD_COIN]: '#eab308',
  [CATEGORY.OTHER_METALS]: '#9ca3af',
  [CATEGORY.CRYPTO]: '#a855f7',
  [CATEGORY.GLOBAL_INDEX]: '#10b981',
  [CATEGORY.FUND]: '#f97316',
  [CATEGORY.OTHER]: '#64748b',
}

/** Small glyph per category (no icon-font/SVG-library dependency). */
export const CATEGORY_ICONS = {
  [CATEGORY.CURRENCY]: '💵',
  [CATEGORY.GOLD_COIN]: '🥇',
  [CATEGORY.OTHER_METALS]: '⛏️',
  [CATEGORY.CRYPTO]: '₿',
  [CATEGORY.GLOBAL_INDEX]: '📈',
  [CATEGORY.FUND]: '🧺',
  [CATEGORY.OTHER]: '🔹',
}

const GOLD_COIN_KEYS = new Set([
  'geram18', 'geram24', 'geram18buy', 'geram24buy',
  'sekeb', 'sekee', 'sekeb_buy', 'sekee_buy', 'sekeb_blubber',
  'sekee_real', 'sekee_down', 'sekee_dollar',
  'retail_sekee', 'retail_sekeb', 'retail_rob', 'retail_nim', 'retail_gerami',
  'nim', 'nim_down', 'nim_blubber', 'rob', 'rob_down', 'rob_blubber',
  'gerami', 'gerami_blubber', 'mesghal',
  'silver_999', 'silver_925',
  'tether_gold_xaut', 'tgju_gold_irg18', 'tgju_gold_irg18_buy',
  'gold_melted_wholesale', 'gold_melted_transfer', 'goldminisize', 'gold_futures',
])

/** Global, ounce/dollar-quoted metals — split out from GOLD_COIN so gold
 *  coins (Rial-priced, domestic) and raw global metal spot prices don't
 *  mix in the same section. */
const OTHER_METALS_KEYS = new Set(['ons', 'ons_buy', 'silver', 'platinum', 'palladium'])

const GLOBAL_INDEX_KEYS = new Set([
  's_p_500_us', 'nasdaq_us', 'dowjones_us', 'oil', 'oil_brent', 'oil_opec', 'bourse',
])

export function resolveCategory(symbolKey) {
  if (symbolKey.startsWith('crypto-')) return CATEGORY.CRYPTO
  if (symbolKey.startsWith('price_') || symbolKey === 'usd_afn_bid' || symbolKey === 'afghan_usd') {
    return CATEGORY.CURRENCY
  }
  if (symbolKey.startsWith('ime_fund_')) return CATEGORY.FUND
  if (OTHER_METALS_KEYS.has(symbolKey)) return CATEGORY.OTHER_METALS
  if (GOLD_COIN_KEYS.has(symbolKey)) return CATEGORY.GOLD_COIN
  if (GLOBAL_INDEX_KEYS.has(symbolKey)) return CATEGORY.GLOBAL_INDEX
  return CATEGORY.OTHER
}
