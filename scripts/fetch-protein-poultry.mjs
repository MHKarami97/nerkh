#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runStdtCategoryJob } from './lib/stdt-scraper.mjs'

const LABEL = 'fetch-protein-poultry'
const SOURCE_URL = 'https://stdt.ir/product-category/poultry/'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'protein-poultry.json')

runStdtCategoryJob({
  label: LABEL,
  sourceUrl: SOURCE_URL,
  outputPath: OUTPUT_PATH,
  category: 'پروتئین - ماکیان',
}).catch((error) => {
  console.error(`[${LABEL}] failed:`, error)
  process.exitCode = 1
})