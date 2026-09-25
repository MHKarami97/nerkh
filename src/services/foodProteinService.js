/**
 * src/services/foodProteinService.js
 *
 * Protein prices reader. Each protein sub-category (chicken/sheep/veal/
 * aquatic/poultry) now gets its own section in the UI, so this reads and
 * caches every snapshot file independently instead of merging all 5 into
 * one combined list (that's what the old getProteinPrices() used to do —
 * kept below, unused by the UI now, only if some other caller still needs
 * the merged view).
 */
import { getMeta, setMeta } from './db.js'

const REFRESH_MS = 30 * 60 * 1000
const RAW_BASE = 'https://raw.githubusercontent.com/MHKarami97/nerkh/main/public/data'

async function fetchJson(url) {
  const response = await fetch(`${url}?ts=${Date.now()}`, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error(`food-protein HTTP ${response.status} (${url})`)
  return response.json()
}

/**
 * Fetches and caches a single protein category snapshot, e.g.
 * getProteinCategory('protein-sheep.json').
 */
export async function getProteinCategory(fileName) {
  const cacheKey = `proteinSnapshot:${fileName}`
  const cached = await getMeta(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < REFRESH_MS) return cached.payload

  try {
    const payload = await fetchJson(`${RAW_BASE}/${fileName}`)
    await setMeta(cacheKey, { fetchedAt: Date.now(), payload })
    return payload
  } catch (rawError) {
    if (cached) return cached.payload
    throw rawError
  }
}

/** @deprecated kept for backward compatibility; UI no longer uses this. */
const FILES = ['protein-chicken.json', 'protein-sheep.json', 'protein-veal.json', 'protein-aquatic.json', 'protein-poultry.json']

export async function getProteinPrices() {
  const cacheKey = 'proteinSnapshot'
  const cached = await getMeta(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < REFRESH_MS) return cached.payload

  try {
    const items = []
    for (const file of FILES) {
      const payload = await fetchJson(`${RAW_BASE}/${file}`)
      if (Array.isArray(payload.items)) {
        items.push(...payload.items.map((item) => ({ ...item, category: payload.category, sourceUpdatedAt: payload.sourceUpdatedAt })))
      }
    }
    const payload = { generatedAt: new Date().toISOString(), currency: 'تومان', items }
    await setMeta(cacheKey, { fetchedAt: Date.now(), payload })
    return payload
  } catch (rawError) {
    if (cached) return cached.payload
    throw rawError
  }
}