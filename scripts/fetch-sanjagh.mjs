#!/usr/bin/env node
/**
 * Usage: node scripts/fetch-sanjagh.mjs --group=<id|all>
 * Groups are processed sequentially through ONE browser page and ONE throttle,
 * so the source never sees concurrent requests.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { CURRENCY, GROUPS, JITTER_MS, MIN_GAP_MS, SOURCE_NAME } from './lib/sanjagh/config.mjs'
import { GroupSyncJob } from './lib/sanjagh/GroupSyncJob.mjs'
import { PriceRowParser } from './lib/sanjagh/PriceRowParser.mjs'
import { RequestThrottle } from './lib/sanjagh/RequestThrottle.mjs'
import { SanjaghPageScraper } from './lib/sanjagh/SanjaghPageScraper.mjs'
import { SnapshotMerger } from './lib/sanjagh/SnapshotMerger.mjs'
import { SnapshotStore } from './lib/sanjagh/SnapshotStore.mjs'

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')

function selectGroups() {
  const arg = process.argv.find((value) => value.startsWith('--group='))
  const id = arg ? arg.slice('--group='.length) : 'all'
  const selected = id === 'all' ? GROUPS : GROUPS.filter((group) => group.id === id)
  if (!selected.length) throw new Error(`unknown group "${id}". valid: all, ${GROUPS.map((group) => group.id).join(', ')}`)
  return selected
}

async function main() {
  const groups = selectGroups()
  const browser = await chromium.launch({ headless: true })
  const scraper = new SanjaghPageScraper({
    browser,
    parser: new PriceRowParser(),
    throttle: new RequestThrottle({ minGapMs: MIN_GAP_MS, jitterMs: JITTER_MS }),
  })

  const summaries = []
  try {
    for (const group of groups) {
      const job = new GroupSyncJob({
        group,
        scraper,
        merger: new SnapshotMerger({ group, source: SOURCE_NAME, currency: CURRENCY }),
        store: new SnapshotStore(join(DATA_DIR, group.fileName)),
      })
      const summary = await job.run()
      summaries.push(summary)
      if (summary.blocked) break
    }
  } finally {
    await scraper.close()
    await browser.close()
  }

  const failed = summaries.filter((summary) => !summary.freshTypeIds.length)
  if (failed.length || summaries.some((summary) => summary.blocked)) {
    throw new Error(`groups without fresh data or blocked: ${failed.map((summary) => summary.groupId).join(', ') || 'see log'}`)
  }
}

main().catch((error) => {
  console.error('[fetch-sanjagh] failed:', error.message)
  process.exitCode = 1
})
