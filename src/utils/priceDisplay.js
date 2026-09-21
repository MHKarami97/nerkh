/**
 * Presentation-only helper: converts the internally-stored Rial price
 * (the unit every provider/normalizer agrees on — see
 * src/services/normalizer.js) into the Toman value shown to the user,
 * since Iranian users conventionally read prices in Toman.
 *
 * Kept as a pure display transform (not baked into the stored Asset) so
 * diffing/caching/direction-detection in marketService always compares
 * like-for-like Rial values regardless of which source produced them.
 */
const RIAL_TO_TOMAN = 10

export function toDisplayPrice(asset) {
  if (asset.unit === 'ریال') {
    return { value: asset.price / RIAL_TO_TOMAN, unit: 'تومان' }
  }
  return { value: asset.price, unit: asset.unit }
}

export function formatDisplayPrice(asset) {
  const { value, unit } = toDisplayPrice(asset)
  return { text: new Intl.NumberFormat('fa-IR').format(Math.round(value)), unit }
}
