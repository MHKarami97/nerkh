import { getMeta, setMeta } from './db.js'

const RAW_BASE = 'https://raw.githubusercontent.com/MHKarami97/nerkh/main/public/data'
const SAME_ORIGIN_BASE = `${import.meta.env.BASE_URL}data`
const REFRESH_MS = 6 * 60 * 60 * 1000 // sources update weekly

async function fetchJson(url) {
  const response = await fetch(`${url}?ts=${Date.now()}`, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error(`service snapshot HTTP ${response.status} (${url})`)
  return response.json()
}

/** Reads one service snapshot: 6h IndexedDB cache -> GitHub raw -> same-origin copy -> stale cache. */
export async function getServiceSnapshot(fileName) {
  const cacheKey = `serviceSnapshot:${fileName}`
  const cached = await getMeta(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < REFRESH_MS) return cached.payload

  let lastError
  for (const base of [RAW_BASE, SAME_ORIGIN_BASE]) {
    try {
      const payload = await fetchJson(`${base}/${fileName}`)
      await setMeta(cacheKey, { fetchedAt: Date.now(), payload })
      return payload
    } catch (error) {
      lastError = error
    }
  }
  if (cached) return cached.payload
  throw lastError
}
