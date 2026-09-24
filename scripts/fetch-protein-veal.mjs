#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const SOURCE_URL = 'https://stdt.ir/product-category/meat-veal/'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'protein-veal.json')

function toNumber(value) {
  const parsed = Number(String(value || '').replace(/[٬,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function text(value) {
  return value.replace(/&nbsp;/gi, ' ').replace(/&/gi, '&').replace(/"/gi, '"').replace(/'/gi, "'").replace(/&zwnj;/gi, '‌').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseRow(row) {
  const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []
  if (cells.length < 4) return null
  const title = text(cells[0])
  const freshness = text(cells[1])
  const origin = text(cells[2])
  const unit = text(cells[3])
  const priceCell = cells[4] ? text(cells[4]) : null
  const price = toNumber(priceCell)
  if (!title || price === null) return null
  return { title, freshness, origin, unit, price }
}

async function renderPage() {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' })
    await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    try {
      await page.waitForFunction(() => document.body.innerText.includes('تومان'), { timeout: 20000 })
    } catch {
      await page.waitForTimeout(4000)
    }
    return await page.content()
  } finally {
    await browser.close()
  }
}

async function main() {
  const html = await renderPage()
  const dateMatch = html.match(/\*\*\s*([۰-۹\d]{1,2}\s+[\u0600-\u06FF\w]+\s+[۰-۹\d]{4})/)
  const sourceUpdatedAt = dateMatch ? text(dateMatch[1]) : null
  const rows = html.split(/<tr[^>]*>/).map(parseRow).filter(Boolean)
  if (rows.length < 1) throw new Error(`Could not parse any veal records`)
  const payload = { source: SOURCE_URL, generatedAt: new Date().toISOString(), sourceUpdatedAt, category: 'پروتئین - گوساله', currency: 'تومان', items: rows }
  await mkdir(dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`[fetch-protein-veal] wrote ${rows.length} records`)
}

main().catch((error) => { console.error('[fetch-protein-veal] failed:', error); process.exitCode = 1 })
