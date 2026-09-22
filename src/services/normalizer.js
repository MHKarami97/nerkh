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
 *     unit: string              // 'ریال' | 'دلار' | '' (see resolveUnit)
 *     updatedAt: string         // ISO timestamp
 *     source: string            // provider id that produced this record ('tgju' | 'mirror' | ...)
 *   }
 *
 * Only symbols that MarketSymbolLabels can confidently translate are kept;
 * anything else is dropped so the UI never shows a raw/undecipherable key.
 */
import { translateSymbol, shouldExcludeSymbol } from './marketSymbolLabels.js'
import { resolveCategory, CATEGORY } from './categories.js'

// Global metals (troy-ounce, USD) and global indices/commodities that TGJU
// quotes in USD rather than Rial.
const USD_QUOTED_KEYS = new Set([
  'ons', 'ons_buy', 'silver', 'platinum', 'palladium',
  's_p_500_us', 'nasdaq_us', 'dowjones_us', 'oil', 'oil_brent', 'oil_opec',
])

// Pure index points with no currency unit at all (must NOT be shown with
// ریال or تومان, and must NOT be divided by 10 in the display layer).
const NO_UNIT_KEYS = new Set(['bourse'])

function parseNumericPrice(raw) {
  if (raw === null || raw === undefined) return NaN
  const cleaned = String(raw).replace(/,/g, '').trim()
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : NaN
}

function parseSourceTimestamp(ts) {
  if (!ts) return new Date().toISOString()
  // TGJU timestamps look like "2026-09-21 09:32:21" (already Tehran local time).
  const isoLike = String(ts).trim().replace(' ', 'T')
  const parsed = new Date(`${isoLike}+03:30`)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function resolveUnit(symbol, category) {
  if (category === CATEGORY.CRYPTO) return symbol.endsWith('-irr') ? 'ریال' : 'دلار'
  if (NO_UNIT_KEYS.has(symbol)) return ''
  if (USD_QUOTED_KEYS.has(symbol)) return 'دلار'
  return 'ریال'
}

/**
 * @param {string} symbol raw TGJU key
 * @param {{p:string,dp:number,dt:string,ts:string}} raw record from ajax.json's `current` map
 * @param {string} source provider id, e.g. 'tgju'
 * @returns {object|null} normalized asset, or null if the symbol should be skipped
 */
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

/**
 * Normalizes an entire TGJU ajax.json payload ({ current: { key: record } })
 * into an array of unified assets, dropping untranslated/invalid entries.
 */
export function normalizeTgjuPayload(payload, source = 'tgju') {
  const current = payload && payload.current ? payload.current : {}
  const out = []
  for (const [symbol, raw] of Object.entries(current)) {
    const asset = normalizeTgjuRecord(symbol, raw, source)
    if (asset) out.push(asset)
  }
  return out
}

/**
 * Applies a fallback direction when a source doesn't supply one (e.g. a
 * future provider without a high/low flag): compares against the
 * previously cached price for the same symbol.
 */
export function withFallbackDirection(asset, previousPrice) {
  if (asset.changeDirection !== 'neutral' || previousPrice === undefined) return asset
  if (asset.price > previousPrice) return { ...asset, changeDirection: 'up' }
  if (asset.price < previousPrice) return { ...asset, changeDirection: 'down' }
  return asset
}
