/**
 * Presentation-only price display helper.
 * Internally most Iranian-market prices are stored as Rial and presented as
 * Toman. Global metal spot prices and global commodity/index prices are
 * already denominated in USD; Tehran's bourse index is unitless.
 */
const RIAL_TO_TOMAN = 10

const USD_SYMBOLS = new Set([
  'ons', 'silver', 'platinum', 'palladium',
  's_p_500_us', 'nasdaq_us', 'dowjones_us', 'oil', 'oil_brent', 'oil_opec',
])

const NO_UNIT_SYMBOLS = new Set(['bourse'])

export function toDisplayPrice(asset) {
  if (NO_UNIT_SYMBOLS.has(asset.symbol)) return { value: asset.price, unit: '' }
  if (USD_SYMBOLS.has(asset.symbol)) return { value: asset.price, unit: 'دلار' }
  if (asset.unit === 'ریال') return { value: asset.price / RIAL_TO_TOMAN, unit: 'تومان' }
  return { value: asset.price, unit: asset.unit }
}

export function formatDisplayPrice(asset) {
  const { value, unit } = toDisplayPrice(asset)
  return { text: new Intl.NumberFormat('fa-IR').format(Math.round(value)), unit }
}
