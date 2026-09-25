#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runStdtCategoryJob } from './lib/stdt-scraper.mjs'

const LABEL = 'fetch-protein-chicken'
const SOURCE_URL = 'https://stdt.ir/product-category/meat-chicken/'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'protein-chicken.json')

runStdtCategoryJob({
  label: LABEL,
  sourceUrl: SOURCE_URL,
  outputPath: OUTPUT_PATH,
  category: 'پروتئین - مرغ',
}).catch((error) => {
  console.error(`[${LABEL}] failed:`, error)
  process.exitCode = 1
})