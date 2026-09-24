#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const SOURCE_URL = 'https://stdt.ir/product-category/beans/'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'beans.json')

function toNumber(value) { const parsed = Number(String(value || '').replace(/[٬,\s]/g, '')); return Number.isFinite(parsed) ? parsed : null }

function parseItems(lines) {
  const headerIdx = lines.findIndex(l => /^\|\s*[۰-۹]{1,2}\s+[\u0600-\u06FF]+\s+[۰-۹]{4}/.test(l))
  const start = headerIdx >= 0 ? headerIdx + 1 : 0
  const items = []
  let i = start
  while (i + 5 < lines.length) {
    const [title, freshness, origin, unit, date, priceLine] = lines.slice(i, i + 6)
    if (!/تومان/.test(priceLine || '')) break
    const price = toNumber((priceLine.match(/[\d٬,]+/) || [])[0])
    if (title && price && price > 0) items.push({ title: title.trim(), freshness: freshness?.trim() || null, origin: origin?.trim() || null, unit: unit?.trim() || null, date: date?.trim() || null, price })
    i += 6
  }
  return items
}

async function renderLines() {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' })
    await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    try { await page.waitForFunction(() => document.body.innerText.includes('تومان'), { timeout: 20000 }) } catch { await page.waitForTimeout(4000) }
    const innerText = await page.evaluate(() => document.body.innerText)
    return innerText.split('\n').map(l => l.trim()).filter(Boolean)
  } finally {
    await browser.close()
  }
}

async function main() {
  const lines = await renderLines()
  const dateHeader = lines.find(l => /^\|\s*[۰-۹]{1,2}\s+[\u0600-\u06FF]+\s+[۰-۹]{4}/.test(l))
  const sourceUpdatedAt = dateHeader ? dateHeader.replace(/[|*]/g, '').trim() : null
  const items = parseItems(lines)
  if (!items.length) { console.error('[fetch-beans] debug first 50 lines:', JSON.stringify(lines.slice(0, 50))); throw new Error('Could not parse any non-zero beans records') }
  const payload = { source: SOURCE_URL, generatedAt: new Date().toISOString(), sourceUpdatedAt, category: 'حبوبات', currency: 'تومان', items }
  await mkdir(dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n')
  console.log(`[fetch-beans] wrote ${items.length} records`)
}

main().catch(error => { console.error('[fetch-beans] failed:', error); process.exitCode = 1 })
