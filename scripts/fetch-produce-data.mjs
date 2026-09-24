#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const SOURCE_URL = 'https://avalkeshavarz.ir/prices'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'produce.json')

function toNumber(value) {
  const parsed = Number(String(value || '').replace(/[٬,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function text(value) {
  return value.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&zwnj;/gi, '‌').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseRecord(segment) {
  const heading = segment.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i) || segment.match(/^([^\n<]{2,40})/)
  if (!heading) return null
  const title = text(heading[1])
  if (!title || /لیست قیمت|قیمت رسمی|میدان مرکزی/i.test(title)) return null
  const value = text(segment)
  const min = value.match(/حداقل قیمت میدان\s*:?\s*([\d٬,.]+)/)
  const max = value.match(/حداکثر قیمت میدان\s*:?\s*([\d٬,.]+)/)
  const average = value.match(/(?:تخمین )?میانگین قیمت میدان\s*:?\s*([\d٬,.]+)/)
  const change = value.match(/تغییرات قیمت\s*:?\s*([+-]?[\d.]+)\s*%/)
  const minPrice = toNumber(min?.[1])
  const maxPrice = toNumber(max?.[1])
  const averagePrice = toNumber(average?.[1])
  if (minPrice === null && maxPrice === null && averagePrice === null) return null
  return { id: title.normalize('NFKC').replace(/\s+/g, '-'), title, minPrice, maxPrice, averagePrice, changePercent: change ? Number(change[1]) : null }
}

function extractItems(html) {
  const byHeading = html.split(/(?=<h[1-6][^>]*>)/i).map(parseRecord).filter(Boolean)
  if (byHeading.length >= 3) return byHeading
  const byMarker = html.split(/(?=حداقل قیمت میدان)/).map((chunk, index, arr) => {
    if (index === 0) return null
    const prevTailMatch = arr[index - 1].match(/([^\n>]{2,40})$/)
    const title = prevTailMatch ? text(prevTailMatch[1]) : null
    if (!title) return null
    return parseRecord(`${title}\n${chunk}`)
  }).filter(Boolean)
  return byMarker
}

async function renderPage() {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' })
    await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    try {
      await page.waitForFunction(() => document.body.innerText.includes('حداقل قیمت میدان'), { timeout: 20000 })
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

  const seen = new Set()
  const items = extractItems(html).filter((item) => item && !seen.has(item.id) && seen.add(item.id))

  if (items.length < 3) {
    console.error('[fetch-produce-data] debug snippet (first 1500 chars of rendered text):')
    console.error(text(html).slice(0, 1500))
    throw new Error(`Could not parse enough produce records (${items.length})`)
  }

  const page = text(html)
  const updated = page.match(/بروزرسانی\s*:\s*([^|]+)(?:\||اعتبار)/)
  const validUntil = page.match(/اعتبار\s*:\s*([^\s|]+)/)
  const payload = { source: SOURCE_URL, generatedAt: new Date().toISOString(), sourceUpdatedAt: updated ? updated[1].trim() : null, validUntil: validUntil ? validUntil[1].trim() : null, isExpired: /منقضی/.test(page), currency: 'تومان', items }
  await mkdir(dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`[fetch-produce-data] wrote ${items.length} records`)
}

main().catch((error) => { console.error('[fetch-produce-data] failed:', error); process.exitCode = 1 })
