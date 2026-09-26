import { CATEGORY } from './categories.js'
import { formatRelativeJalaliDate } from '../utils/relativeDate.js'

const RIAL_PER_TOMAN = 10

function toRial(tomanPrice) {
  return typeof tomanPrice === 'number' && Number.isFinite(tomanPrice) ? tomanPrice * RIAL_PER_TOMAN : null
}

function changeDirectionFromPercent(percent) {
  if (typeof percent !== 'number' || !Number.isFinite(percent) || percent === 0) return 'neutral'
  return percent > 0 ? 'up' : 'down'
}

function buildSymbol(prefix, index, title) {
  return `food:${prefix}:${index}:${title}`
}

export function normalizeProducePayload(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  const updatedAt = payload?.generatedAt || new Date().toISOString()

  return items
    .filter((item) => item && item.title && typeof item.averagePrice === 'number')
    .map((item, index) => ({
      symbol: buildSymbol('produce', index, item.title),
      label: item.title,
      category: CATEGORY.FOOD_PRODUCE,
      price: toRial(item.averagePrice),
      changePercent: typeof item.changePercent === 'number' ? item.changePercent : 0,
      changeDirection: changeDirectionFromPercent(item.changePercent),
      unit: 'ریال',
      updatedAt,
      source: 'avalkeshavarz',
      priceRange: {
        min: toRial(item.minPrice),
        average: toRial(item.averagePrice),
        max: toRial(item.maxPrice),
      },
    }))
    .filter((asset) => asset.price !== null)
}

function normalizeSimpleFoodPayload(payload, prefix, category, source) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  const updatedAt = payload?.generatedAt || new Date().toISOString()

  return items
    .filter((item) => item && item.title && typeof item.price === 'number')
    .map((item, index) => ({
      symbol: buildSymbol(prefix, index, item.title),
      label: item.title,
      category,
      price: toRial(item.price),
      changePercent: 0,
      changeDirection: 'neutral',
      unit: 'ریال',
      updatedAt: item.date || updatedAt,
      source,
      foodMeta: {
        unit: item.unit || '',
        updatedLabel: formatRelativeJalaliDate(item.date),
      },
    }))
    .filter((asset) => asset.price !== null)
}

export function normalizeBeansPayload(payload) {
  return normalizeSimpleFoodPayload(payload, 'beans', CATEGORY.FOOD_BEANS, 'stdt-beans')
}

export function normalizeDriedFruitsPayload(payload) {
  return normalizeSimpleFoodPayload(payload, 'dried-fruits', CATEGORY.FOOD_DRIED_FRUITS, 'stdt-dried-fruits')
}

export function normalizeProteinPayload(payload, category, prefix) {
  return normalizeSimpleFoodPayload(payload, prefix, category, 'stdt-protein')
}
