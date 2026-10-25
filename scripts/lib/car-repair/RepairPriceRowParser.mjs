import { toEnglishDigits } from '../persian-date.mjs'

const INVISIBLE_MARKS = /[\u200e\u200f\u202a-\u202e]/g
const PRICE_CELL = /^(\D*?)\s*(\d[\d٬,]*)(?:\s*[-–—]\s*(\d[\d٬,]*))?\s*(?:تومان)?\s*$/

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
 * Pure and DOM-free so it can be unit-tested without a browser.
 */
export class RepairPriceRowParser {
  parse(rows) {
    const seen = new Set()
    const items = []
    for (const cells of rows) {
      const item = this.parseRow(cells)
      if (!item || seen.has(item.id)) continue
      seen.add(item.id)
      items.push(item)
    }
    return items
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
