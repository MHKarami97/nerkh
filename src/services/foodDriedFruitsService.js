/** Dried fruits prices reader: fetches from GitHub raw, cached 30 minutes. */
import { getMeta, setMeta } from './db.js'

const CACHE_KEY = 'driedFruitsSnapshot'
const REFRESH_MS = 30 * 60 * 1000
const RAW_URL = 'https://raw.githubusercontent.com/MHKarami97/nerkh/main/public/data/dried-fruits.json'

async function fetchJson(url) {
  const response = await fetch(`${url}?ts=${Date.now()}`, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error(`food-dried-fruits HTTP ${response.status} (${url})`)
  return response.json()
}

export async function getDriedFruitsPrices() {
  const cached = await getMeta(CACHE_KEY)
  if (cached && Date.now() - cached.fetchedAt < REFRESH_MS) return cached.payload

  try {
    const payload = await fetchJson(RAW_URL)
    await setMeta(CACHE_KEY, { fetchedAt: Date.now(), payload })
    return payload
  } catch (rawError) {
    if (cached) return cached.payload
    throw rawError
  }
}
