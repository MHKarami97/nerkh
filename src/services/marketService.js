/**
 * Application/domain service: orchestrates refreshing market data.
 *
 * Responsibilities:
 *  - Hydrate the Pinia store instantly from IndexedDB on startup.
 *  - Run the provider chain (TGJU -> mirror -> ...) every REFRESH_INTERVAL_MS.
 *  - Compute up/down change direction, falling back to a price comparison
 *    against the previous cached value when a source doesn't supply one.
 *  - Persist every successful refresh to IndexedDB.
 *  - Catch up immediately when the tab regains focus/visibility after
 *    being backgrounded for longer than the refresh interval, so the data
 *    never silently goes stale while the user is looking at the page.
 */
import { fetchFromProviderChain } from './providers/index.js'
import { withFallbackDirection } from './normalizer.js'
import { getAllAssets, putAssets, getMeta, setMeta } from './db.js'

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes, per product requirement
const LAST_FETCH_KEY = 'lastFetchAt'

export class MarketService {
  constructor(store) {
    this.store = store
    this.intervalId = null
    this.isRefreshing = false
  }

  async init() {
    const cached = await getAllAssets()
    if (cached.length) {
      this.store.hydrate(cached, { source: 'cache', updatedAt: await getMeta(LAST_FETCH_KEY) })
    }
    await this.refresh()
    this._startInterval()
    this._bindVisibilityCatchUp()
  }

  _startInterval() {
    if (this.intervalId) clearInterval(this.intervalId)
    this.intervalId = setInterval(() => this.refresh(), REFRESH_INTERVAL_MS)
  }

  _bindVisibilityCatchUp() {
    const catchUpIfStale = async () => {
      if (document.visibilityState !== 'visible') return
      const lastFetchAt = await getMeta(LAST_FETCH_KEY, 0)
      if (Date.now() - Number(lastFetchAt) >= REFRESH_INTERVAL_MS) {
        this.refresh()
      }
    }
    document.addEventListener('visibilitychange', catchUpIfStale)
    window.addEventListener('focus', catchUpIfStale)
  }

  async refresh() {
    if (this.isRefreshing) return
    this.isRefreshing = true
    this.store.setStatus('loading')
    try {
      const { assets, source } = await fetchFromProviderChain()
      const previousBySymbol = new Map(this.store.allAssets.map((a) => [a.symbol, a.price]))
      const reconciled = assets.map((asset) => withFallbackDirection(asset, previousBySymbol.get(asset.symbol)))

      await putAssets(reconciled)
      await setMeta(LAST_FETCH_KEY, Date.now())

      this.store.hydrate(reconciled, { source, updatedAt: new Date().toISOString() })
      this.store.setStatus('ready')
    } catch (err) {
      console.error('[nerkh] market refresh failed:', err)
      this.store.setStatus('error')
    } finally {
      this.isRefreshing = false
    }
  }

  dispose() {
    if (this.intervalId) clearInterval(this.intervalId)
  }
}
