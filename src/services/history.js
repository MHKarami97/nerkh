/**
 * Historical price data for the per-asset chart page, at three
 * resolutions:
 *
 *  - 'day'   fine-grained (~5-minute) points from today's
 *            public/data/history/{YYYY-MM-DD}.json file.
 *  - 'week'  the same fine-grained per-day files, merged across the last
 *            7 UTC days (still bounded: 7 small file fetches, cached).
 *  - 'month' / 'year'  ONE point per day, read from the single
 *            public/data/history/daily-summary.json file instead of
 *            downloading dozens/hundreds of daily files. This is what
 *            keeps long-range charts cheap: the summary file only grows
 *            by one entry per symbol per day (~365 rows/year/symbol),
 *            not one entry every 5 minutes.
 *
 * Both file types are produced by scripts/fetch-market-data.mjs and
 * cached client-side in IndexedDB (see services/db.js) so repeat visits
 * don't re-download data that can no longer change.
 */
import { getHistoryDay, setHistoryDay } from './db.js'

const FRESH_MS = 5 * 60 * 1000
const SUMMARY_KEY = '__daily-summary__'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function dateKeyDaysAgo(offset) {
  const d = new Date(Date.now() - offset * 86400000)
  return d.toISOString().slice(0, 10)
}

async function fetchJson(path) {
  const url = `${import.meta.env.BASE_URL}data/${path}?ts=${Date.now()}`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!res.ok) throw new Error(`history HTTP ${res.status} for ${path}`)
  return res.json()
}

/** Returns one day's fine-grained payload, using the IndexedDB cache when valid. */
async function getDayData(dateKey) {
  const isToday = dateKey === todayKey()
  const cached = await getHistoryDay(dateKey)

  if (cached && (!isToday || Date.now() - cached.fetchedAt < FRESH_MS)) {
    return cached.payload
  }

  try {
    const payload = await fetchJson(`history/${dateKey}.json`)
    await setHistoryDay(dateKey, { payload, fetchedAt: Date.now() })
    return payload
  } catch (err) {
    if (cached) return cached.payload // stale cache beats no data at all
    if (!isToday) return null // that day simply has no recorded history
    throw err
  }
}

/** Returns the one-point-per-day summary payload, cached for FRESH_MS. */
async function getDailySummary() {
  const cached = await getHistoryDay(SUMMARY_KEY)
  if (cached && Date.now() - cached.fetchedAt < FRESH_MS) return cached.payload

  try {
    const payload = await fetchJson('history/daily-summary.json')
    await setHistoryDay(SUMMARY_KEY, { payload, fetchedAt: Date.now() })
    return payload
  } catch (err) {
    if (cached) return cached.payload
    throw err
  }
}

async function getFineGrainedHistory(symbol, dayCount) {
  const points = []
  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const dateKey = dateKeyDaysAgo(offset)
    try {
      const day = await getDayData(dateKey)
      const bucket = (day && day.points && day.points[symbol]) || []
      points.push(...bucket)
    } catch {
      // Missing/unavailable day file: skip it rather than failing the chart.
    }
  }
  return points
}

async function getSummaryHistory(symbol, dayCount) {
  const summary = await getDailySummary()
  const bucket = (summary && summary.points && summary.points[symbol]) || []
  return bucket.slice(-dayCount).map((entry) => ({ t: `${entry.date}T12:00:00.000Z`, p: entry.p }))
}

export const HISTORY_RANGES = ['day', 'week', 'month', 'year']

/**
 * Returns a chronologically sorted array of { t, p } points for one
 * symbol, for the given range: 'day' | 'week' | 'month' | 'year'.
 */
export async function getSymbolHistory(symbol, range = 'day') {
  let points
  if (range === 'day') points = await getFineGrainedHistory(symbol, 1)
  else if (range === 'week') points = await getFineGrainedHistory(symbol, 7)
  else if (range === 'month') points = await getSummaryHistory(symbol, 30)
  else points = await getSummaryHistory(symbol, 365)

  return points.sort((a, b) => new Date(a.t) - new Date(b.t))
}
