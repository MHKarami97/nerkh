/** Produce snapshot reader: fetches the committed JSON straight from GitHub raw
 * (so new data shows up without waiting for a site redeploy), cached 30 minutes. */
import { getMeta, setMeta } from './db.js'

const CACHE_KEY = 'produceSnapshot'
const REFRESH_MS = 30 * 60 * 1000
const RAW_URL = 'https://raw.githubusercontent.com/MHKarami97/nerkh/main/public/data/produce.json'
const SAME_ORIGIN_FALLBACK = `${import.meta.env.BASE_URL}data/produce.json`

async function fetchJson(url) {
  const response = await fetch(`${url}?ts=${Date.now()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`produce snapshot HTTP ${response.status} (${url})`)
  return response.json()
}

export async function getProducePrices() {
  const cached = await getMeta(CACHE_KEY)
  if (cached && Date.now() - cached.fetchedAt < REFRESH_MS) return cached.payload

  try {
    const payload = await fetchJson(RAW_URL)
    await setMeta(CACHE_KEY, { fetchedAt: Date.now(), payload })
    return payload
  } catch (rawError) {
    try {
      const payload = await fetchJson(SAME_ORIGIN_FALLBACK)
      await setMeta(CACHE_KEY, { fetchedAt: Date.now(), payload })
      return payload
    } catch {
      if (cached) return cached.payload
      throw rawError
    }
  }
}
