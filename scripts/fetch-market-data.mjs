#!/usr/bin/env node
/**
 * Server-side data fetcher, run every 5 minutes by
 * .github/workflows/fetch-data.yml. Produces public/data/latest.json,
 * the same-origin snapshot consumed by MirrorProvider on the client.
 *
 * Runs on GitHub's runners, so it hits sources directly with no CORS
 * concerns (CORS is a browser-only restriction). If every source fails,
 * the existing public/data/latest.json is left untouched — the workflow
 * detects "no diff" and skips the commit, so the mirror always serves
 * the last known-good snapshot instead of going empty.
 *
 * Adding a future additional source here: add a fetcher function with the
 * same signature ( () => Promise<Asset[]> ) to SOURCES below, in priority
 * order. First one that returns >= 5 assets wins.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeTgjuPayload } from '../src/services/normalizer.js'
import { normalizeGerdaliPayload } from '../src/services/providers/GerdaliProvider.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'latest.json')
const TGJU_ENDPOINT = 'https://call2.tgju.org/ajax.json'
const GERDALI_ENDPOINT = 'https://raw.githubusercontent.com/ithouse98/gerdali-market-data/main/data/all.json'
const TIMEOUT_MS = 10_000
const MIN_ACCEPTABLE_ASSETS = 5
const MIN_ACCEPTABLE_GERDALI_ASSETS = 3

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

async function main() {
  try {
    const { assets, sourceId } = await fetchFromFirstAvailableSource()
    await mkdir(dirname(OUTPUT_PATH), { recursive: true })
    const payload = {
      generatedAt: new Date().toISOString(),
      source: sourceId,
      assets,
    }
    await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8')
    console.log(`[fetch-market-data] wrote ${assets.length} assets from "${sourceId}"`)
  } catch (err) {
    console.error('[fetch-market-data] all sources failed, leaving previous snapshot untouched:', err.message)
    try {
      await readFile(OUTPUT_PATH)
    } catch {
      await mkdir(dirname(OUTPUT_PATH), { recursive: true })
      await writeFile(OUTPUT_PATH, JSON.stringify({ generatedAt: null, source: null, assets: [] }, null, 2) + '\n', 'utf-8')
    }
  }
}

main()
