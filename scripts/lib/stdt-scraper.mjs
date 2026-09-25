/**
 * scripts/lib/stdt-scraper.mjs
 *
 * Shared scraping/parsing logic for every stdt.ir product-category page
 * (meat-sheep, meat-veal, meat-chicken, aquatic, poultry, beans, dried-fruits).
 *
 * Why this file exists (bug fix):
 * The old per-script `parseItems` located the *first* item by searching for a
 * header line ("| ۰۹ مهر ۱۴۰۴") and then walked forward in fixed 6-line
 * groups from `headerIdx + 1`. On the poultry/aquatic pages that header
 * regex never matched (extra markup around the date), so `headerIdx` stayed
 * -1, the 6-line grouping started at the wrong offset, and every item after
 * that was misaligned -> zero valid records, forever.
 *
 * The fix removes the dependency on finding the header first: `parseItems`
 * below anchors on the *price line* itself (the one and only line that
 * reliably ends with "تومان" for every category) and looks 5 lines back for
 * title/freshness/origin/unit/date. This self-corrects regardless of how
 * much boilerplate stdt.ir puts above the table on a given category page.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { chromium } from 'playwright'
import { reorderToDayMonthYear, isOlderThanMonths } from './persian-date.mjs'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const MAX_ITEM_AGE_MONTHS = 2

const HEADER_DATE_RE = /[۰-۹]{1,2}\s+[\u0600-\u06FF]+\s+[۰-۹]{4}/
const ITEM_DATE_RE = /^[۰-۹]{1,2}\/[۰-۹]{1,2}\/[۰-۹]{4}$/
const PRICE_LINE_RE = /تومان\s*$/
const PRICE_NUMBER_RE = /[\d٬,]+/

function toNumber(value) {
  const parsed = Number(String(value ?? '').replace(/[٬,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function stripMarkers(line) {
  return line.replace(/[|*]/g, '').trim()
}

/**
 * Scans every line; whenever a line looks like a price ("... تومان"), takes
 * the 5 preceding lines as [title, freshness, origin, unit, date]. Skips a
 * window if the "title" slot is itself a price/header line (guards against
 * drift when two price lines end up adjacent, e.g. a zero-price item).
 */
export function parseItems(lines) {
  const items = []

  for (let i = 5; i < lines.length; i++) {
    const priceLine = lines[i]
    if (!PRICE_LINE_RE.test(priceLine)) continue

    const [title, freshness, origin, unit, date] = lines.slice(i - 5, i)
    if (!title || !date) continue
    if (PRICE_LINE_RE.test(title) || HEADER_DATE_RE.test(stripMarkers(title))) continue
    if (!ITEM_DATE_RE.test(date.trim())) continue

    const price = toNumber((priceLine.match(PRICE_NUMBER_RE) || [])[0])
    if (!price || price <= 0) continue

    items.push({
      title: title.trim(),
      freshness: freshness?.trim() || null,
      origin: origin?.trim() || null,
      unit: unit?.trim() || null,
      date: reorderToDayMonthYear(date.trim()),
      price,
    })
  }

  return items
}

export function findSourceUpdatedAt(lines) {
  const headerLine = lines.find((line) => HEADER_DATE_RE.test(stripMarkers(line)))
  return headerLine ? stripMarkers(headerLine) : null
}

async function renderLines(sourceUrl) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ userAgent: USER_AGENT })
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    try {
      await page.waitForFunction(() => document.body.innerText.includes('تومان'), { timeout: 20000 })
    } catch {
      await page.waitForTimeout(4000)
    }
    const innerText = await page.evaluate(() => document.body.innerText)
    return innerText.split('\n').map((line) => line.trim()).filter(Boolean)
  } finally {
    await browser.close()
  }
}

/**
 * Runs one full category job: render -> parse -> drop stale items -> write JSON.
 * Every fetch-*.mjs script becomes a thin config object around this call.
 */
export async function runStdtCategoryJob({ label, sourceUrl, outputPath, category, currency = 'تومان' }) {
  const lines = await renderLines(sourceUrl)
  const sourceUpdatedAt = findSourceUpdatedAt(lines)
  const parsedItems = parseItems(lines)
  const items = parsedItems.filter((item) => !isOlderThanMonths(item.date, MAX_ITEM_AGE_MONTHS))

  if (!items.length) {
    console.error(`[${label}] debug first 50 lines:`, JSON.stringify(lines.slice(0, 50)))
    throw new Error(`Could not parse any non-zero, recent ${label} records`)
  }

  const payload = {
    source: sourceUrl,
    generatedAt: new Date().toISOString(),
    sourceUpdatedAt,
    category,
    currency,
    items,
  }

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, JSON.stringify(payload, null, 2) + '\n')
  console.log(`[${label}] wrote ${items.length} records`)
  return payload
}