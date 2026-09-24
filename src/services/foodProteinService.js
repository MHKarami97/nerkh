/** Protein prices reader: merges 5 chicken/sheep/veal/aquatic/poultry snapshots.
 * Fetches from GitHub raw first (so new commits show immediately), cached 30 min. */
import { getMeta, setMeta } from './db.js'

const CACHE_KEY = 'proteinSnapshot'
const REFRESH_MS = 30 * 60 * 1000
const RAW_BASE = 'https://raw.githubusercontent.com/MHKarami97/nerkh/main/public/data'
const FILES = ['protein-chicken.json', 'protein-sheep.json', 'protein-veal.json', 'protein-aquatic.json', 'protein-poultry.json']

async function fetchJson(url) {
  const response = await fetch(`${url}?ts=${Date.now()}`, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error(`food-protein HTTP ${response.status} (${url})`)
  return response.json()
}

export async function getProteinPrices() {
  const cached = await getMeta(CACHE_KEY)
  if (cached && Date.now() - cached.fetchedAt < REFRESH_MS) return cached.payload

  try {
    const items = []
    for (const file of FILES) {
      const payload = await fetchJson(`${RAW_BASE}/${file}`)
      if (Array.isArray(payload.items)) {
        items.push(...payload.items.map(item => ({ ...item, category: payload.category, sourceUpdatedAt: payload.sourceUpdatedAt })))
      }
    }
    const payload = { generatedAt: new Date().toISOString(), currency: 'تومان', items }
    await setMeta(CACHE_KEY, { fetchedAt: Date.now(), payload })
    return payload
  } catch (rawError) {
    if (cached) return cached.payload
    throw rawError
  }
}
