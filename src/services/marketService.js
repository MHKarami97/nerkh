/**
 * Application/domain service: orchestrates refreshing market data.
 *
 * Responsibilities:
 *  - Hydrate the Pinia store instantly from IndexedDB on startup.
 *  - Poll the provider chain (TGJU -> Gerdali -> mirror) every
 *    REFRESH_INTERVAL_MS (1 minute — matches the cadence of the primary
 *    TGJU direct call from the browser; the server-side mirror snapshot
 *    itself still only changes every 5 minutes, which is the shortest
 *    reliable cron granularity GitHub Actions supports).
 *  - Skip an unnecessary network round-trip on every page load/refresh:
 *    if the last successful fetch happened less than REFRESH_INTERVAL_MS
 *    ago, serve straight from the IndexedDB cache and only schedule the
 *    next refresh for whenever that interval actually elapses.
 *  - Compute up/down change direction, falling back to a price comparison
 *    against the previous cached value when a source doesn't supply one.
 *  - Catch up immediately when the tab regains focus/visibility after
 *    being backgrounded for longer than the refresh interval.
 */
import { fetchFromProviderChain } from './providers/index.js'
import { withFallbackDirection } from './normalizer.js'
import { getAllAssets, putAssets, getMeta, setMeta } from './db.js'

export const REFRESH_INTERVAL_MS = 60 * 1000 // 1 minute
const LAST_FETCH_KEY = 'lastFetchAt'

export class MarketService {
  constructor(store) {
    this.store = store
    this.intervalId = null
    this.delayTimeoutId = null
    this.isRefreshing = false
  }

  async init() {
    const cached = await getAllAssets()
    if (cached.length) {
      this.store.hydrate(cached, { source: 'cache', updatedAt: await getMeta(LAST_FETCH_KEY) })
    }

    const lastFetchAt = Number(await getMeta(LAST_FETCH_KEY, 0)) || 0
    const elapsed = Date.now() - lastFetchAt

    if (!cached.length || elapsed >= REFRESH_INTERVAL_MS) {
      await this.refresh()
      this._startInterval()
    } else {
      // Cache is still fresh (e.g. the user just hit F5): don't re-hit the
      // network, just wait out the remainder of the interval.
      this.store.setStatus('ready')
      const remaining = REFRESH_INTERVAL_MS - elapsed
      this.delayTimeoutId = setTimeout(() => {
        this.refresh()
        this._startInterval()
      }, remaining)
    }

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
    if (this.delayTimeoutId) clearTimeout(this.delayTimeoutId)
  }
}
