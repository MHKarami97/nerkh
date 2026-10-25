import { MAX_ATTEMPTS, REQUEST_GAP_MS } from './config.mjs'
import { sleep, withRetry } from '../retry.mjs'

export class CarRepairSyncJob {
  constructor({ catalog, scraper, merger, store, logger = console, requestGapMs = REQUEST_GAP_MS }) {
    this.catalog = catalog
    this.scraper = scraper
    this.merger = merger
    this.store = store
    this.logger = logger
    this.requestGapMs = requestGapMs
  }

  async run() {
    const previous = await this.store.read()
    const outcomes = await this.scrapeAll()
    const result = this.merger.merge(previous, outcomes)

    if (!result.freshTypeIds.length) {
      throw new Error('every source page failed; previous snapshot kept untouched')
    }
    if (result.staleTypeIds.length) {
      this.logger.warn(`::warning::kept previous data for: ${result.staleTypeIds.join(', ')}`)
    }
    if (!result.changed) {
      this.logger.log('[car-repair] no price changes; file not rewritten')
      return result
    }

    await this.store.write(result.payload)
    this.logger.log(`[car-repair] wrote ${result.payload.items.length} items (${result.freshTypeIds.length} fresh types)`)
    return result
  }

  async scrapeAll() {
    const outcomes = new Map()
    for (const [index, type] of this.catalog.entries()) {
      if (index > 0) await sleep(this.requestGapMs)
      try {
        const outcome = await withRetry(() => this.scraper.scrape(type), {
          attempts: MAX_ATTEMPTS,
          onRetry: (error, attempt) => this.logger.warn(`[car-repair] ${type.id} attempt ${attempt} failed: ${error.message}`),
        })
        outcomes.set(type.id, outcome)
        this.logger.log(`[car-repair] ${type.id}: ${outcome.items.length} rows`)
      } catch (error) {
        this.logger.error(`[car-repair] ${type.id} failed: ${error.message}`)
        outcomes.set(type.id, { error })
      }
    }
    return outcomes
  }
}
