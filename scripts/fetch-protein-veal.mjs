#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runStdtCategoryJob } from './lib/stdt-scraper.mjs'

const LABEL = 'fetch-protein-veal'
const SOURCE_URL = 'https://stdt.ir/product-category/meat-veal/'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'protein-veal.json')

runStdtCategoryJob({
  label: LABEL,
  sourceUrl: SOURCE_URL,
  outputPath: OUTPUT_PATH,
  category: 'پروتئین - گوساله',
}).catch((error) => {
  console.error(`[${LABEL}] failed:`, error)
  process.exitCode = 1
})