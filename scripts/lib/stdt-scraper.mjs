import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { chromium } from 'playwright'
import { isOlderThanMonths, normalizeDateText, reorderToDayMonthYear } from './persian-date.mjs'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const MAX_ITEM_AGE_MONTHS = 2
const PRICE_LINE_RE = /تومان\s*$/
const PRICE_NUMBER_RE = /[\d۰-۹٠-٩٬,]+/
const ITEM_DATE_RE = /^[۰-۹٠-٩\d]{1,2}\/[۰-۹٠-٩\d]{1,2}\/[۰-۹٠-٩\d]{4}$/
const HEADER_DATE_RE = /[۰-۹٠-٩\d]{1,2}\s+[\u0600-\u06FF]+\s+[۰-۹٠-٩\d]{4}/

function toEnglishDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
}

function toNumber(value) {
  const parsed = Number(toEnglishDigits(String(value ?? '')).replace(/[٬,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function cleanLine(value) {
  return normalizeDateText(value).replace(/[|*]/g, '').trim()
}

function normalizeTitle(value) {
  return String(value ?? '')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, '')
    .replace(/[ \t\r\n]+/g, ' ')
    .trim()
}

function normalizeField(value) {
  return String(value ?? '')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, '')
    .replace(/[ \t\r\n]+/g, ' ')
    .trim() || null
}

export function parseItems(lines) {
  const items = []

  for (let priceIndex = 5; priceIndex < lines.length; priceIndex++) {
    const priceLine = cleanLine(lines[priceIndex])
    if (!PRICE_LINE_RE.test(priceLine)) continue

    const [title, freshness, origin, unit, rawDate] = lines.slice(priceIndex - 5, priceIndex).map(cleanLine)
    if (!title || !rawDate || !ITEM_DATE_RE.test(rawDate)) continue

    const price = toNumber((priceLine.match(PRICE_NUMBER_RE) || [])[0])
    if (!price || price <= 0) continue

    const date = reorderToDayMonthYear(rawDate)
    if (isOlderThanMonths(date, MAX_ITEM_AGE_MONTHS)) continue

    items.push({
      title: normalizeTitle(title),
      freshness: normalizeField(freshness),
      origin: normalizeField(origin),
      unit: normalizeField(unit),
      date,
      price,
    })
  }

  return items
}

export function findSourceUpdatedAt(lines) {
  const line = lines.find((item) => HEADER_DATE_RE.test(cleanLine(item)))
  return line ? cleanLine(line) : null
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

export async function runStdtCategoryJob({ label, sourceUrl, outputPath, category, currency = 'تومان' }) {
  const lines = await renderLines(sourceUrl)
  const sourceUpdatedAt = findSourceUpdatedAt(lines)
  const items = parseItems(lines)

  if (!items.length) {
    console.error(`[${label}] debug first 80 lines:`, JSON.stringify(lines.slice(0, 80)))
    throw new Error(`Could not parse any recent ${label} records`)
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
  await writeFile(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`[${label}] wrote ${items.length} recent records`)
  return payload
}