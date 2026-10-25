import { MAX_ATTEMPTS } from './config.mjs'
import { BlockedError } from './errors.mjs'
import { withRetry } from '../retry.mjs'

/** Syncs one group (= one JSON file). Pages are fetched strictly one after another. */
export class GroupSyncJob {
  constructor({ group, scraper, merger, store, logger = console }) {
    this.group = group
    this.scraper = scraper
    this.merger = merger
    this.store = store
    this.logger = logger
  }

  async run() {
    const previous = await this.store.read()
    const { outcomes, blocked } = await this.scrapeAll()
    const result = this.merger.merge(previous, outcomes)
    const summary = {
      groupId: this.group.id,
      blocked,
      written: false,
      freshTypeIds: result.freshTypeIds,
      staleTypeIds: result.staleTypeIds,
    }

    if (result.staleTypeIds.length) {
      this.logger.warn(`::warning::[${this.group.id}] kept previous data for: ${result.staleTypeIds.join(', ')}`)
    }
    if (!result.freshTypeIds.length) {
      this.logger.error(`[${this.group.id}] no page succeeded; previous snapshot untouched`)
      return summary
    }
    if (!result.changed) {
      this.logger.log(`[${this.group.id}] no price changes; file not rewritten`)
      return summary
    }

    await this.store.write(result.payload)
    this.logger.log(`[${this.group.id}] wrote ${result.payload.items.length} items (${result.freshTypeIds.length}/${this.group.types.length} types fresh)`)
    return { ...summary, written: true }
  }

  async scrapeAll() {
    const outcomes = new Map()
    let blocked = false

    for (const type of this.group.types) {
      try {
        const outcome = await withRetry(() => this.scraper.scrape(type), {
          attempts: MAX_ATTEMPTS,
          shouldRetry: (error) => !(error instanceof BlockedError),
          onRetry: (error, attempt) => this.logger.warn(`[${this.group.id}] ${type.id} attempt ${attempt} failed: ${error.message}`),
        })
        outcomes.set(type.id, outcome)
        const note = outcome.skipped.length ? `, ${outcome.skipped.length} non-Toman row(s) skipped` : ''
        this.logger.log(`[${this.group.id}] ${type.id}: ${outcome.items.length} rows${note}`)
      } catch (error) {
        outcomes.set(type.id, { error })
        this.logger.error(`[${this.group.id}] ${type.id} failed: ${error.message}`)
        if (error instanceof BlockedError) {
          blocked = true
          break
        }
      }
    }
    return { outcomes, blocked }
  }
}
