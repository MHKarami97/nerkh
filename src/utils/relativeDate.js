const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

const MAX_LOOKBACK_DAYS = 400

function toEnglishDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_INDIC_DIGITS.indexOf(digit)))
}

function toPersianDigits(value) {
  return String(value ?? '').replace(/\d/g, (digit) => PERSIAN_DIGITS[digit])
}

function parseDayMonthYear(value) {
  const normalized = String(value ?? '').replace(/\s+/g, '').trim()
  const parts = normalized.split('/').map((part) => Number(toEnglishDigits(part)))
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

function daysAgo(target, referenceDate = new Date()) {
  for (let offset = 0; offset <= MAX_LOOKBACK_DAYS; offset += 1) {
    const candidate = new Date(referenceDate)
    candidate.setDate(candidate.getDate() - offset)
    const candidateJalali = gregorianToJalali(candidate.getFullYear(), candidate.getMonth() + 1, candidate.getDate())
    if (candidateJalali.year === target.year && candidateJalali.month === target.month && candidateJalali.day === target.day) {
      return offset
    }
  }
  return null
}

export function formatRelativeJalaliDate(rawDate) {
  if (!rawDate) return ''
  const target = parseDayMonthYear(rawDate)
  if (!target) return rawDate

  const diff = daysAgo(target)
  if (diff === null) return rawDate
  if (diff === 0) return 'امروز'
  if (diff === 1) return 'دیروز'
  return `${toPersianDigits(diff)} روز پیش`
}
