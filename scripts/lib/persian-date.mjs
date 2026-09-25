/**
 * scripts/lib/persian-date.mjs
 *
 * Small, dependency-free helpers for the Jalali (Shamsi) dates scraped from
 * stdt.ir. No npm package is added on purpose: this is one self-contained
 * algorithm (the well-known Jalaali <-> Gregorian conversion), and pulling a
 * whole date library in for it would be overkill for a scraper script.
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** Converts Persian/Arabic-indic digits inside a string to plain ASCII digits. */
export function toEnglishDigits(value) {
  return String(value ?? '').replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
}

/**
 * stdt.ir renders each item's date as "MM/DD/YYYY" (Persian digits) — e.g.
 * "۰۹/۲۵/۱۴۰۳" means month 09, day 25, year 1403. The UI wants the day on
 * the left and the month in the middle, so this swaps the first two segments
 * into "DD/MM/YYYY" ("۲۵/۰۹/۱۴۰۳").
 */
export function reorderToDayMonthYear(rawDate) {
  if (!rawDate) return rawDate
  const parts = rawDate.split('/').map((part) => part.trim())
  if (parts.length !== 3) return rawDate
  const [month, day, year] = parts
  return `${day}/${month}/${year}`
}

/**
 * Gregorian -> Jalali conversion (standard algorithm, e.g. used by jalaali-js).
 * Kept local/pure so the scraper scripts have zero extra runtime dependencies.
 */
export function gregorianToJalali(gYear, gMonth, gDay) {
  const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy2 = gMonth > 2 ? gYear + 1 : gYear

  let days =
    355666 +
    365 * gYear +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gDay +
    gDaysInMonth[gMonth - 1]

  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461

  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }

  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const jd = days < 186 ? 1 + (days % 31) : 1 + ((days - 186) % 30)

  return { year: jy, month: jm, day: jd }
}

/** Parses an already-reordered "DD/MM/YYYY" (Persian digits) string. */
export function parseReorderedDate(reorderedDate) {
  if (!reorderedDate) return null
  const ascii = toEnglishDigits(reorderedDate)
  const [day, month, year] = ascii.split('/').map((part) => Number(part.trim()))
  if (![day, month, year].every(Number.isFinite)) return null
  return { day, month, year }
}

/**
 * True when a "DD/MM/YYYY" (Persian digits) item date is more than
 * `maxMonths` Jalali months older than `now`. Unparsable dates are treated
 * as "keep" (return false) so a scraping glitch on a single field never
 * silently drops an otherwise valid, freshly-fetched item.
 */
export function isOlderThanMonths(reorderedDate, maxMonths, now = new Date()) {
  const parsed = parseReorderedDate(reorderedDate)
  if (!parsed) return false

  const today = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const currentTotalMonths = today.year * 12 + today.month
  const itemTotalMonths = parsed.year * 12 + parsed.month

  return currentTotalMonths - itemTotalMonths > maxMonths
}