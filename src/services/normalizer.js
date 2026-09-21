/**
 * Domain: Normalizer
 * Converts a raw provider record into the app's unified Asset model:
 *
 *   {
 *     symbol: string            // raw source key, e.g. 'geram18'
 *     label: string             // Persian label
 *     category: string          // one of CATEGORY.*
 *     price: number             // numeric price, commas stripped
 *     changePercent: number     // signed percent change vs previous tick
 *     changeDirection: 'up'|'down'|'neutral'
 *     unit: string              // 'ریال' for IRR-priced items, 'دلار' for USD-quoted globals
 *     updatedAt: string         // ISO timestamp
 *     source: string            // provider id that produced this record ('tgju' | 'mirror' | ...)
 *   }
 *
 * Only symbols that MarketSymbolLabels can confidently translate are kept;
 * anything else is dropped so the UI never shows a raw/undecipherable key.
 */
import { translateSymbol, shouldExcludeSymbol } from './marketSymbolLabels.js'
import { resolveCategory, CATEGORY } from './categories.js'

const USD_QUOTED_KEYS = new Set(['ons', 'ons_buy', 'silver', 'platinum', 'palladium'])

function parseNumericPrice(raw) {
  if (raw === null || raw === undefined) return NaN
  const cleaned = String(raw).replace(/,/g, '').trim()
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : NaN
}

function parseSourceTimestamp(ts) {
  if (!ts) return new Date().toISOString()
  const isoLike = String(ts).trim().replace(' ', 'T')
  const parsed = new Date(`${isoLike}+03:30`)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function resolveUnit(symbol, category) {
  if (category === CATEGORY.CRYPTO) return symbol.endsWith('-irr') ? 'ریال' : 'دلار'
  if (USD_QUOTED_KEYS.has(symbol)) return 'دلار'
  return 'ریال'
}

export function normalizeTgjuRecord(symbol, raw, source = 'tgju') {
  if (shouldExcludeSymbol(symbol)) return null
  const { label, translated } = translateSymbol(symbol)
  if (!translated) return null

  const price = parseNumericPrice(raw.p)
  if (!Number.isFinite(price) || price <= 0) return null

  const category = resolveCategory(symbol)
  const changePercent = Number(raw.dp) || 0
  const changeDirection = raw.dt === 'high' ? 'up' : raw.dt === 'low' ? 'down' : 'neutral'

  return {
    symbol,
    label,
    category,
    price,
    changePercent,
    changeDirection,
    unit: resolveUnit(symbol, category),
    updatedAt: parseSourceTimestamp(raw.ts),
    source,
  }
}

export function normalizeTgjuPayload(payload, source = 'tgju') {
  const current = payload && payload.current ? payload.current : {}
  const out = []
  for (const [symbol, raw] of Object.entries(current)) {
    const asset = normalizeTgjuRecord(symbol, raw, source)
    if (asset) out.push(asset)
  }
  return out
}

export function withFallbackDirection(asset, previousPrice) {
  if (asset.changeDirection !== 'neutral' || previousPrice === undefined) return asset
  if (asset.price > previousPrice) return { ...asset, changeDirection: 'up' }
  if (asset.price < previousPrice) return { ...asset, changeDirection: 'down' }
  return asset
}
