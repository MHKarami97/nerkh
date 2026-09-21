/**
 * Historical price data for the per-asset chart page.
 *
 * The server-side workflow (.github/workflows/fetch-data.yml, running
 * scripts/fetch-market-data.mjs) appends one price point per symbol every
 * ~5 minutes into a per-day file at public/data/history/{YYYY-MM-DD}.json
 * (UTC date), so a single JSON file never grows unbounded.
 *
 * Caching rule: a past day's file is immutable once the day is over, so
 * once fully downloaded it is cached in IndexedDB forever. Today's file is
 * still being appended to server-side, so it's treated as fresh for 5
 * minutes (matching the mirror's own update cadence) and re-fetched after
 * that.
 */
import { getHistoryDay, setHistoryDay } from './db.js'

const DAY_FRESH_MS = 5 * 60 * 1000

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function dateKeyDaysAgo(offset) {
  const d = new Date(Date.now() - offset * 86400000)
  return d.toISOString().slice(0, 10)
}

async function fetchDayFile(dateKey) {
  const url = `${import.meta.env.BASE_URL}data/history/${dateKey}.json?ts=${Date.now()}`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!res.ok) throw new Error(`history HTTP ${res.status}`)
  return res.json()
}

/** Returns the parsed day payload, using the IndexedDB cache when valid. */
export async function getDayData(dateKey) {
  const isToday = dateKey === todayKey()
  const cached = await getHistoryDay(dateKey)

  if (cached && (!isToday || Date.now() - cached.fetchedAt < DAY_FRESH_MS)) {
    return cached.payload
  }

  try {
    const payload = await fetchDayFile(dateKey)
    await setHistoryDay(dateKey, { payload, fetchedAt: Date.now() })
    return payload
  } catch (err) {
    if (cached) return cached.payload // stale cache beats no data at all
    if (!isToday) return null // that day simply has no recorded history
    throw err
  }
}

/**
 * Returns a chronologically sorted array of { t, p } points for one symbol,
 * covering the last `days` calendar days (default: just today).
 */
export async function getSymbolHistory(symbol, days = 1) {
  const points = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dateKey = dateKeyDaysAgo(offset)
    try {
      const day = await getDayData(dateKey)
      const bucket = (day && day.points && day.points[symbol]) || []
      points.push(...bucket)
    } catch {
      // Missing/unavailable day file: skip it rather than failing the chart.
    }
  }
  return points.sort((a, b) => new Date(a.t) - new Date(b.t))
}
