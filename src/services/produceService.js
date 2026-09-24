/** Same-origin produce snapshot reader with a 30-minute IndexedDB cache. */
import { getMeta, setMeta } from './db.js'

const CACHE_KEY = 'produceSnapshot'
const REFRESH_MS = 30 * 60 * 1000

export async function getProducePrices() {
  const cached = await getMeta(CACHE_KEY)
  if (cached && Date.now() - cached.fetchedAt < REFRESH_MS) return cached.payload

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/produce.json?ts=${Date.now()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`produce snapshot HTTP ${response.status}`)
    const payload = await response.json()
    await setMeta(CACHE_KEY, { fetchedAt: Date.now(), payload })
    return payload
  } catch (error) {
    if (cached) return cached.payload
    throw error
  }
}
