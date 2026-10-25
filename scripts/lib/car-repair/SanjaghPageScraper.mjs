import { SOURCE_ORIGIN } from './config.mjs'
import { cleanText } from './RepairPriceRowParser.mjs'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const UPDATED_AT_RE = /آخرین\s*به\s*روز\s*رسانی[^\n\d]*([\d۰-۹]{1,2}\s+\S+\s+[\d۰-۹]{4})/

export class SanjaghPageScraper {
  constructor({ browser, parser, origin = SOURCE_ORIGIN, timeoutMs = 30_000 }) {
    this.browser = browser
    this.parser = parser
    this.origin = origin
    this.timeoutMs = timeoutMs
  }

  buildUrl(type) {
    return `${this.origin}/price/${encodeURIComponent(type.slug)}`
  }

  async scrape(type) {
    const url = this.buildUrl(type)
    const page = await this.browser.newPage({ userAgent: USER_AGENT })
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.timeoutMs })
      await page.waitForSelector('table tr td', { timeout: 20_000 })

      const rows = await page.$$eval('table tr', (trs) =>
        trs.map((tr) => Array.from(tr.children, (cell) => cell.textContent ?? '')),
      )
      const bodyText = await page.evaluate(() => document.body.innerText)

      const items = this.parser.parse(rows)
      if (!items.length) throw new Error(`no price rows parsed from ${url}`)

      const updated = cleanText(bodyText).match(UPDATED_AT_RE)
      return { items, sourceUpdatedAt: updated ? updated[1] : null, url }
    } finally {
      await page.close()
    }
  }
}
