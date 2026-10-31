/**
 * Produce prices scraped from avalkeshavarz.ir are Central Square (میدان مرکزی تره‌بار)
 * wholesale prices. Shoppers pay more: Iran's Price Determination Board allows 15%
 * retail margin on unpackaged produce (up to 30% with provincial approval), and
 * field reports put the square-to-shop gap at 26-41%.
 * Change MARKUP_PERCENT here; every produce price in the app follows.
 */
const MARKUP_PERCENT = 30
const ROUND_TO_TOMAN = 100

const faNumber = new Intl.NumberFormat('fa-IR')

export class ProduceMarkup {
  #factor

  constructor(percent, roundTo) {
    this.percent = percent
    this.roundTo = roundTo
    this.#factor = 1 + percent / 100
  }

  apply(toman) {
    if (typeof toman !== 'number' || !Number.isFinite(toman)) return null
    return Math.round((toman * this.#factor) / this.roundTo) * this.roundTo
  }

  describe(baseToman) {
    return `قیمت میدان تره‌بار: ${faNumber.format(baseToman)} تومان + ${faNumber.format(this.percent)}٪ تا سطح بازار`
  }
}

export const produceMarkup = new ProduceMarkup(MARKUP_PERCENT, ROUND_TO_TOMAN)
