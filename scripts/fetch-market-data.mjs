#!/usr/bin/env node
/**
 * Server-side data fetcher, run every 30 minutes by
 * .github/workflows/fetch-data.yml. Produces public/data/latest.json —
 * the same-origin "current price" snapshot consumed by MirrorProvider on
 * the client.
 *
 * Historical snapshotting (public/data/history/{date}.json +
 * daily-summary.json) is currently DISABLED via the HISTORY_ENABLED flag
 * below, to keep the repository's size from growing indefinitely. The
 * functions are kept intact (not deleted) so history + the chart UI can
 * be turned back on later just by flipping this flag and the matching
 * CHART_ENABLED flag in src/views/AssetDetailView.vue.
 *
 * Runs on GitHub's runners, so it hits sources directly with no CORS
 * concerns. If every source fails, the existing outputs are left
 * untouched.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeTgjuPayload } from '../src/services/normalizer.js'
import { normalizeGerdaliPayload } from '../src/services/providers/GerdaliProvider.js'

const HISTORY_ENABLED = false

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'public', 'data')
const OUTPUT_PATH = join(DATA_DIR, 'latest.json')
const HISTORY_DIR = join(DATA_DIR, 'history')
const SUMMARY_PATH = join(HISTORY_DIR, 'daily-summary.json')
const TGJU_ENDPOINT = 'https://call2.tgju.org/ajax.json'
const GERDALI_ENDPOINT = 'https://raw.githubusercontent.com/ithouse98/gerdali-market-data/main/data/all.json'
const TIMEOUT_MS = 10_000
const MIN_ACCEPTABLE_ASSETS = 5
const MIN_ACCEPTABLE_GERDALI_ASSETS = 3
const MIN_HISTORY_GAP_MS = 4 * 60 * 1000 // guards against double-counting on overlapping/late runs
const SUMMARY_MAX_DAYS = 400 // ~ a bit over a year of daily points per symbol, then oldest trimmed

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchFromTgju() {
  const res = await fetchWithTimeout(TGJU_ENDPOINT, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`TGJU HTTP ${res.status}`)
  const payload = await res.json()
  const assets = normalizeTgjuPayload(payload, 'tgju')
  if (assets.length < MIN_ACCEPTABLE_ASSETS) throw new Error('TGJU payload had too few usable records')
  return assets
}

async function fetchFromGerdali() {
  const res = await fetchWithTimeout(GERDALI_ENDPOINT, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Gerdali HTTP ${res.status}`)
  const payload = await res.json()
  const assets = normalizeGerdaliPayload(payload, 'gerdali')
  if (assets.length < MIN_ACCEPTABLE_GERDALI_ASSETS) throw new Error('Gerdali payload had too few usable records')
  return assets
}

const SOURCES = [
  { id: 'tgju', fetch: fetchFromTgju },
  { id: 'gerdali', fetch: fetchFromGerdali },
  // { id: 'some-future-source', fetch: fetchFromSomeFutureSource },
]

async function fetchFromFirstAvailableSource() {
  const errors = []
  for (const source of SOURCES) {
    try {
      const assets = await source.fetch()
      return { assets, sourceId: source.id }
    } catch (err) {
      errors.push(`${source.id}: ${err.message}`)
    }
  }
  throw new Error(`All server-side sources failed -> ${errors.join(' | ')}`)
}

function todayDateKey() {
  return new Date().toISOString().slice(0, 10)
}

async function readJsonOrDefault(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf-8'))
  } catch {
    return fallback
  }
}

/** Appends a fine-grained point per symbol to today's day file (for day/week ranges). Disabled by default — see HISTORY_ENABLED. */
async function appendDayHistory(assets, dateKey) {
  const filePath = join(HISTORY_DIR, `${dateKey}.json`)
  const day = await readJsonOrDefault(filePath, { date: dateKey, points: {} })

  const nowIso = new Date().toISOString()
  for (const asset of assets) {
    const bucket = day.points[asset.symbol] || (day.points[asset.symbol] = [])
    const last = bucket[bucket.length - 1]
    if (last && Date.now() - new Date(last.t).getTime() < MIN_HISTORY_GAP_MS) continue
    bucket.push({ t: nowIso, p: asset.price })
  }

  await writeFile(filePath, JSON.stringify(day), 'utf-8')
}

/** Upserts today's one-point-per-symbol entry in the long-range summary file. Disabled by default — see HISTORY_ENABLED. */
async function updateDailySummary(assets, dateKey) {
  const summary = await readJsonOrDefault(SUMMARY_PATH, { points: {} })

  for (const asset of assets) {
    const bucket = summary.points[asset.symbol] || (summary.points[asset.symbol] = [])
    const lastEntry = bucket[bucket.length - 1]
    if (lastEntry && lastEntry.date === dateKey) {
      lastEntry.p = asset.price // keep overwriting today's entry with the latest price seen
    } else {
      bucket.push({ date: dateKey, p: asset.price })
      if (bucket.length > SUMMARY_MAX_DAYS) bucket.splice(0, bucket.length - SUMMARY_MAX_DAYS)
    }
  }

  await writeFile(SUMMARY_PATH, JSON.stringify(summary), 'utf-8')
}

async function main() {
  try {
    const { assets, sourceId } = await fetchFromFirstAvailableSource()
    await mkdir(DATA_DIR, { recursive: true })

    const payload = { generatedAt: new Date().toISOString(), source: sourceId, assets }
    await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8')
    console.log(`[fetch-market-data] wrote ${assets.length} assets from "${sourceId}"`)

    if (HISTORY_ENABLED) {
      await mkdir(HISTORY_DIR, { recursive: true })
      const dateKey = todayDateKey()
      await appendDayHistory(assets, dateKey)
      await updateDailySummary(assets, dateKey)
      console.log('[fetch-market-data] updated day history + daily summary')
    }
  } catch (err) {
    console.error('[fetch-market-data] all sources failed, leaving previous snapshot untouched:', err.message)
    try {
      await readFile(OUTPUT_PATH)
    } catch {
      await mkdir(DATA_DIR, { recursive: true })
      await writeFile(OUTPUT_PATH, JSON.stringify({ generatedAt: null, source: null, assets: [] }, null, 2) + '\n', 'utf-8')
    }
  }
}

main()
