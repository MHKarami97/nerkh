import { toEnglishDigits } from '../persian-date.mjs'

const INVISIBLE_MARKS = /[\u200e\u200f\u202a-\u202e]/g
const PRICE_CELL = /^(\D*?)\s*(\d[\d٬,]*)(?:\s*[-–—]\s*(\d[\d٬,]*))?\s*(?:تومان)?\s*$/
const PERCENT_SIGN = /[%٪]/

export function cleanText(value) {
  return String(value ?? '')
    .replace(INVISIBLE_MARKS, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim()
}

export function toId(title) {
  return title.normalize('NFKC').replace(/\s+/g, '-')
}

function toToman(digits) {
  const value = Number(digits.replace(/[٬,]/g, ''))
  return Number.isFinite(value) && value > 0 ? value : null
}

/**
 * Turns table rows ([title, "هر سرویس ۵۰۰٬۰۰۰ - ۱٬۰۰۰٬۰۰۰"]) into price items.
 * - Every table of the page is passed in, so all tabs/blocks are covered.
 * - Identical rows (desktop + mobile copies of the same table) are collapsed.
 * - Percentage rows ("کل کار ۱۰% - ۳۵%") are not Toman prices and are reported as skipped.
 * Pure and DOM-free, so it is unit-testable without a browser.
 */
export class PriceRowParser {
  parse(rows) {
    const seenSignatures = new Set()
    const idCounts = new Map()
    const items = []
    const skipped = []

    for (const cells of rows) {
      if (this.isPercentRow(cells)) {
        skipped.push(cleanText(cells[0]))
        continue
      }
      const item = this.parseRow(cells)
      if (!item) continue

      const signature = `${item.title}|${item.unit}|${item.minPrice}|${item.maxPrice}`
      if (seenSignatures.has(signature)) continue
      seenSignatures.add(signature)

      const count = idCounts.get(item.id) ?? 0
      idCounts.set(item.id, count + 1)
      items.push(count === 0 ? item : { ...item, id: `${item.id}-${count + 1}` })
    }
    return { items, skipped }
  }

  isPercentRow(cells) {
    return Array.isArray(cells) && cells.length >= 2 && PERCENT_SIGN.test(String(cells[1])) && /\d|[۰-۹]/.test(String(cells[1]))
  }

  parseRow(cells) {
    if (!Array.isArray(cells) || cells.length < 2) return null

    const title = cleanText(cells[0])
    const match = toEnglishDigits(cleanText(cells[1])).match(PRICE_CELL)
    if (!title || !match) return null

    const first = toToman(match[2])
    const second = match[3] ? toToman(match[3]) : first
    if (first === null || second === null) return null

    const minPrice = Math.min(first, second)
    const maxPrice = Math.max(first, second)

    return {
      id: toId(title),
      title,
      unit: cleanText(match[1]) || null,
      minPrice,
      maxPrice,
      averagePrice: Math.round((minPrice + maxPrice) / 2),
    }
  }
}
