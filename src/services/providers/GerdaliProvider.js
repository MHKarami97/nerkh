import { BaseProvider } from './BaseProvider.js'
import { translateSymbol, shouldExcludeSymbol } from '../marketSymbolLabels.js'
import { resolveCategory } from '../categories.js'

const GERDALI_ENDPOINT = 'https://raw.githubusercontent.com/ithouse98/gerdali-market-data/main/data/all.json'
const TIMEOUT_MS = 6000
const TOMAN_TO_RIAL = 10

const CURRENCY_NAME_TO_SYMBOL = [
  [/دلار\s*آمریکا|^دلار$/, 'price_dollar_rl'],
  [/یورو/, 'price_eur'],
  [/پوند/, 'price_gbp'],
  [/درهم/, 'price_aed'],
  [/لیر/, 'price_try'],
  [/یوان/, 'price_cny'],
  [/فرانک/, 'price_chf'],
  [/دلار\s*کانادا/, 'price_cad'],
]

const GOLD_NAME_TO_SYMBOL = [
  [/۱۸|18\s*عیار|هجده/, 'geram18'],
  [/۲۴|24\s*عیار|بیست\s*و\s*چهار/, 'geram24'],
  [/مثقال/, 'mesghal'],
  [/امامی/, 'sekee'],
  [/بهار\s*آزادی/, 'sekeb'],
  [/نیم\s*سکه/, 'nim'],
  [/ربع\s*سکه/, 'rob'],
  [/گرمی/, 'gerami'],
  [/انس/, 'ons'],
]

const CRYPTO_SYMBOL_TO_IRR_KEY = {
  BTC: 'crypto-bitcoin-irr',
  BITCOIN: 'crypto-bitcoin-irr',
  USDT: 'crypto-tether-irr',
  TETHER: 'crypto-tether-irr',
  ETH: 'crypto-ethereum-irr',
  ETHEREUM: 'crypto-ethereum-irr',
}

function safeNumber(value) {
  if (value === null || value === undefined) return NaN
  const cleaned = String(value).replace(/,/g, '').trim()
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : NaN
}

function pickFirst(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key]
  }
  return undefined
}

function matchSymbol(name, table) {
  const normalized = String(name || '').trim()
  for (const [pattern, symbol] of table) {
    if (pattern.test(normalized)) return symbol
  }
  return null
}

function toIsoTimestamp(rawValue) {
  const parsed = new Date(rawValue)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

/**
 * Fallback source #2 (tried after TGJU, before the same-origin mirror): a
 * community-maintained GitHub-hosted market data feed
 * (github.com/ithouse98/gerdali-market-data). Read directly from
 * raw.githubusercontent.com, which serves permissive CORS headers, so
 * this works straight from the browser with no proxy needed.
 *
 * Documented assumption: this environment could not directly download and
 * inspect the raw JSON of that repo to lock in exact field names, so the
 * lookups below are intentionally defensive — several candidate key names
 * are tried per field, and Persian names are matched with tolerant
 * patterns instead of exact string equality. If prices ever look off,
 * verify the live shape at the URL above and adjust the tables/candidate
 * keys in this file only; no other file needs to change.
 *
 * Unit handling: Gerdali quotes currency/gold in Toman, so values are
 * converted to Rial (× 10) here to stay consistent with the TGJU-based
 * normalizer (src/services/normalizer.js), which is the unit every other
 * part of the app assumes. Crypto has no direct IRR price from this
 * source, so it is derived as priceUsd × (USD→Toman rate from this same
 * payload) × 10 — the same anchor-rate technique used by the reference
 * site for its own crypto conversions.
 */
export class GerdaliProvider extends BaseProvider {
  id = 'gerdali'

  async fetchAssets() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(GERDALI_ENDPOINT, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`Gerdali HTTP ${res.status}`)
      const payload = await res.json()
      const assets = normalizeGerdaliPayload(payload, this.id)
      if (assets.length < 3) throw new Error('Gerdali payload had too few usable records')
      return assets
    } finally {
      clearTimeout(timer)
    }
  }
}

export function normalizeGerdaliPayload(payload, source = 'gerdali') {
  const root = (payload && payload.data) || payload || {}
  const generatedAtRaw = (payload && (payload.generatedAt || payload.generatedat)) || Date.now()
  const isoTimestamp = toIsoTimestamp(generatedAtRaw)

  const currencyItems = (root.currencies && root.currencies.items) || root.currencies || []
  const goldItems = (root.gold && root.gold.items) || root.gold || []
  const cryptoItems = (root.crypto && root.crypto.items) || root.crypto || []

  const buildAsset = (symbol, priceRial) => {
    if (shouldExcludeSymbol(symbol)) return null
    const { label, translated } = translateSymbol(symbol)
    return {
      symbol,
      label: translated ? label : symbol,
      category: resolveCategory(symbol),
      price: priceRial,
      changePercent: 0,
      changeDirection: 'neutral',
      unit: 'ریال',
      updatedAt: isoTimestamp,
      source,
    }
  }

  const out = []
  let usdTomanRate = null

  for (const item of currencyItems) {
    const name = pickFirst(item, ['name', 'title'])
    const symbol = matchSymbol(name, CURRENCY_NAME_TO_SYMBOL)
    const toman = safeNumber(pickFirst(item, ['selltoman', 'sell', 'price', 'toman']))
    if (!symbol || !Number.isFinite(toman) || toman <= 0) continue
    if (symbol === 'price_dollar_rl') usdTomanRate = toman
    const asset = buildAsset(symbol, toman * TOMAN_TO_RIAL)
    if (asset) out.push(asset)
  }

  for (const item of goldItems) {
    const name = pickFirst(item, ['name', 'title'])
    const symbol = matchSymbol(name, GOLD_NAME_TO_SYMBOL)
    const toman = safeNumber(pickFirst(item, ['price', 'sell', 'toman']))
    if (!symbol || !Number.isFinite(toman) || toman <= 0) continue
    const asset = buildAsset(symbol, toman * TOMAN_TO_RIAL)
    if (asset) out.push(asset)
  }

  if (usdTomanRate) {
    for (const item of cryptoItems) {
      const rawSymbol = String(pickFirst(item, ['symbol', 'code']) || '').trim().toUpperCase()
      const irrKey = CRYPTO_SYMBOL_TO_IRR_KEY[rawSymbol]
      const priceUsd = safeNumber(pickFirst(item, ['priceusd', 'price_usd', 'usd', 'price']))
      if (!irrKey || !Number.isFinite(priceUsd) || priceUsd <= 0) continue
      const rial = priceUsd * usdTomanRate * TOMAN_TO_RIAL
      const asset = buildAsset(irrKey, rial)
      if (asset) out.push(asset)
    }
  }

  return out
}
