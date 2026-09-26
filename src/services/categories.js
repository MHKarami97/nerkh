/**
 * Infrastructure: category resolver + presentation metadata (color/icon).
 */

export const CATEGORY = Object.freeze({
  CURRENCY: 'currency',
  GOLD_COIN: 'gold',
  OTHER_METALS: 'metals',
  CRYPTO: 'crypto',
  GLOBAL_INDEX: 'index',
  FUND: 'fund',
  OTHER: 'other',
  FOOD_PRODUCE: 'food-produce',
  FOOD_SHEEP: 'food-sheep',
  FOOD_VEAL: 'food-veal',
  FOOD_CHICKEN: 'food-chicken',
  FOOD_AQUATIC: 'food-aquatic',
  FOOD_POULTRY: 'food-poultry',
  FOOD_DRIED_FRUITS: 'food-dried-fruits',
  FOOD_BEANS: 'food-beans',
})

export const CATEGORY_LABELS = {
  [CATEGORY.CURRENCY]: 'ارز',
  [CATEGORY.GOLD_COIN]: 'طلا و سکه',
  [CATEGORY.OTHER_METALS]: 'سایر فلزات جهانی',
  [CATEGORY.CRYPTO]: 'رمزارز',
  [CATEGORY.GLOBAL_INDEX]: 'شاخص و کامودیتی جهانی',
  [CATEGORY.FUND]: 'صندوق‌های کالایی',
  [CATEGORY.OTHER]: 'سایر',
  [CATEGORY.FOOD_PRODUCE]: 'میوه، صیفی‌جات',
  [CATEGORY.FOOD_SHEEP]: 'گوسفند',
  [CATEGORY.FOOD_VEAL]: 'گوساله',
  [CATEGORY.FOOD_CHICKEN]: 'مرغ',
  [CATEGORY.FOOD_AQUATIC]: 'ماهی و میگو',
  [CATEGORY.FOOD_POULTRY]: 'ماکیان',
  [CATEGORY.FOOD_DRIED_FRUITS]: 'خشکبار',
  [CATEGORY.FOOD_BEANS]: 'حبوبات',
}

export const CATEGORY_COLORS = {
  [CATEGORY.CURRENCY]: '#4a89ff',
  [CATEGORY.GOLD_COIN]: '#eab308',
  [CATEGORY.OTHER_METALS]: '#9ca3af',
  [CATEGORY.CRYPTO]: '#a855f7',
  [CATEGORY.GLOBAL_INDEX]: '#10b981',
  [CATEGORY.FUND]: '#f97316',
  [CATEGORY.OTHER]: '#64748b',
  [CATEGORY.FOOD_PRODUCE]: '#22c55e',
  [CATEGORY.FOOD_SHEEP]: '#a16207',
  [CATEGORY.FOOD_VEAL]: '#b91c1c',
  [CATEGORY.FOOD_CHICKEN]: '#f59e0b',
  [CATEGORY.FOOD_AQUATIC]: '#0ea5e9',
  [CATEGORY.FOOD_POULTRY]: '#ca8a04',
  [CATEGORY.FOOD_DRIED_FRUITS]: '#d97706',
  [CATEGORY.FOOD_BEANS]: '#65a30d',
}

export const CATEGORY_ICONS = {
  [CATEGORY.CURRENCY]: '💵',
  [CATEGORY.GOLD_COIN]: '🥇',
  [CATEGORY.OTHER_METALS]: '⛏️',
  [CATEGORY.CRYPTO]: '₿',
  [CATEGORY.GLOBAL_INDEX]: '📈',
  [CATEGORY.FUND]: '🧺',
  [CATEGORY.OTHER]: '🔹',
  [CATEGORY.FOOD_PRODUCE]: '🥦',
  [CATEGORY.FOOD_SHEEP]: '🐑',
  [CATEGORY.FOOD_VEAL]: '🐄',
  [CATEGORY.FOOD_CHICKEN]: '🐔',
  [CATEGORY.FOOD_AQUATIC]: '🐟',
  [CATEGORY.FOOD_POULTRY]: '🦃',
  [CATEGORY.FOOD_DRIED_FRUITS]: '🥜',
  [CATEGORY.FOOD_BEANS]: '🫘',
}

const GOLD_COIN_KEYS = new Set([
  'geram18', 'geram24', 'geram18buy', 'geram24buy',
  'sekeb', 'sekee', 'sekeb_buy', 'sekee_buy', 'sekeb_blubber',
  'sekee_real', 'sekee_down', 'sekee_dollar',
  'retail_sekee', 'retail_sekeb', 'retail_rob', 'retail_nim', 'retail_gerami',
  'nim', 'nim_down', 'nim_blubber', 'rob', 'rob_down', 'rob_blubber',
  'gerami', 'gerami_blubber', 'mesghal', 'silver_999', 'silver_925',
  'tether_gold_xaut', 'tgju_gold_irg18', 'tgju_gold_irg18_buy',
  'gold_melted_wholesale', 'gold_melted_transfer', 'goldminisize', 'gold_futures',
])

// Global USD/ounce metals. ons_buy intentionally omitted.
const OTHER_METALS_KEYS = new Set(['ons', 'silver', 'platinum', 'palladium'])

const GLOBAL_INDEX_KEYS = new Set([
  's_p_500_us', 'nasdaq_us', 'dowjones_us', 'oil', 'oil_brent', 'oil_opec', 'bourse',
])

export function resolveCategory(symbolKey) {
  if (symbolKey.startsWith('crypto-')) return CATEGORY.CRYPTO
  if (symbolKey.startsWith('price_') || symbolKey === 'usd_afn_bid' || symbolKey === 'afghan_usd') return CATEGORY.CURRENCY
  if (symbolKey.startsWith('ime_fund_')) return CATEGORY.FUND
  if (OTHER_METALS_KEYS.has(symbolKey)) return CATEGORY.OTHER_METALS
  if (GOLD_COIN_KEYS.has(symbolKey)) return CATEGORY.GOLD_COIN
  if (GLOBAL_INDEX_KEYS.has(symbolKey)) return CATEGORY.GLOBAL_INDEX
  return CATEGORY.OTHER
}
