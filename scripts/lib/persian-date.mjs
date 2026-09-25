const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

export function toEnglishDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
}

export function normalizeDateText(value) {
  return String(value ?? '')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, '')
    .replace(/[\u066c,٬]/g, '')
    .trim()
}

/**
 * Source format is MM/DD/YYYY. The stored format is DD/MM/YYYY.
 * Example: ۰۹/۲۵/۱۴۰۳ -> ۲۵/۰۹/۱۴۰۳.
 */
export function reorderToDayMonthYear(rawDate) {
  const normalized = normalizeDateText(rawDate)
  const parts = normalized.split('/').map((part) => part.trim())
  if (parts.length !== 3) return normalized || null

  const [month, day, year] = parts
  if (!/^\d{1,2}$/.test(toEnglishDigits(month))) return normalized
  if (!/^\d{1,2}$/.test(toEnglishDigits(day))) return normalized
  if (!/^\d{4}$/.test(toEnglishDigits(year))) return normalized

  return `${day}/${month}/${year}`
}

export function parseDate(value) {
  const parts = normalizeDateText(value).split('/').map((part) => Number(toEnglishDigits(part.trim())))
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null

  const [day, month, year] = parts
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000) return null
  return { day, month, year }
}

function gregorianToJalali(gYear, gMonth, gDay) {
  const daysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy2 = gMonth > 2 ? gYear + 1 : gYear
  let days = 355666 + 365 * gYear + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gDay + daysInMonth[gMonth - 1]
  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  const month = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const day = days < 186 ? 1 + (days % 31) : 1 + ((days - 186) % 30)
  return { year: jy, month, day }
}

export function isOlderThanMonths(dateValue, maxMonths, now = new Date()) {
  const item = parseDate(dateValue)
  if (!item) return true

  const today = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const currentMonth = today.year * 12 + today.month
  const itemMonth = item.year * 12 + item.month
  const monthDifference = currentMonth - itemMonth

  return monthDifference > maxMonths || (monthDifference === maxMonths && item.day < today.day)
}