import { getMeta, setMeta } from './db.js'

const RAW_URL = 'https://raw.githubusercontent.com/MHKarami97/nerkh/main/public/data/car-repair.json'
const SAME_ORIGIN_URL = `${import.meta.env.BASE_URL}data/car-repair.json`
const CACHE_KEY = 'carRepairSnapshot'
const REFRESH_MS = 6 * 60 * 60 * 1000 // source updates weekly

async function fetchJson(url) {
  const response = await fetch(`${url}?ts=${Date.now()}`, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error(`car-repair HTTP ${response.status} (${url})`)
  return response.json()
}

export async function getCarRepairPrices() {
  const cached = await getMeta(CACHE_KEY)
  if (cached && Date.now() - cached.fetchedAt < REFRESH_MS) return cached.payload

  for (const url of [RAW_URL, SAME_ORIGIN_URL]) {
    try {
      const payload = await fetchJson(url)
      await setMeta(CACHE_KEY, { fetchedAt: Date.now(), payload })
      return payload
    } catch (error) {
      if (url === SAME_ORIGIN_URL) {
        if (cached) return cached.payload
        throw error
      }
    }
  }
}
