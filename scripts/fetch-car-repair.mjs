#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { CURRENCY, OUTPUT_FILE_NAME, SERVICE_TYPES, SOURCE_NAME } from './lib/car-repair/config.mjs'
import { CarRepairSyncJob } from './lib/car-repair/CarRepairSyncJob.mjs'
import { RepairPriceRowParser } from './lib/car-repair/RepairPriceRowParser.mjs'
import { SanjaghPageScraper } from './lib/car-repair/SanjaghPageScraper.mjs'
import { SnapshotMerger } from './lib/car-repair/SnapshotMerger.mjs'
import { SnapshotStore } from './lib/car-repair/SnapshotStore.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', OUTPUT_FILE_NAME)

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    const job = new CarRepairSyncJob({
      catalog: SERVICE_TYPES,
      scraper: new SanjaghPageScraper({ browser, parser: new RepairPriceRowParser() }),
      merger: new SnapshotMerger({ catalog: SERVICE_TYPES, source: SOURCE_NAME, currency: CURRENCY }),
      store: new SnapshotStore(OUTPUT_PATH),
    })
    await job.run()
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('[fetch-car-repair] failed:', error.message)
  process.exitCode = 1
})
