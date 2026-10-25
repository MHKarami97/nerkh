import { BLOCK_STATUSES, SOURCE_ORIGIN } from './config.mjs'
import { BlockedError } from './errors.mjs'
import { cleanText } from './PriceRowParser.mjs'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const UPDATED_AT_RE = /آخرین\s*به\s*روز\s*رسانی[^\n\d۰-۹]*([\d۰-۹]{1,2}\s+\S+\s+[\d۰-۹]{4})/
const ALLOWED_SUBRESOURCES = new Set(['script', 'xhr', 'fetch'])

/**
 * Cheap scraping of one sanjagh price page:
 * - ONE document request per page (all tabs are inside the same page).
 * - A single browser context/page is reused for every page of the run.
 * - Images, fonts, CSS, media and third-party hosts are aborted before they hit the network.
 */
export class SanjaghPageScraper {
  constructor({ browser, parser, throttle, origin = SOURCE_ORIGIN, timeoutMs = 30_000, blockStatuses = BLOCK_STATUSES }) {
    this.browser = browser
    this.parser = parser
    this.throttle = throttle
    this.origin = origin
    this.originHost = new URL(origin).hostname
    this.timeoutMs = timeoutMs
    this.blockStatuses = new Set(blockStatuses)
    this.page = null
  }

  buildUrl(type) {
    return `${this.origin}/price/${encodeURIComponent(type.slug)}`
  }

  async scrape(type) {
    const url = this.buildUrl(type)
    const page = await this.getPage()

    await this.throttle.wait()
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.timeoutMs })
    const status = response?.status() ?? 0
    if (this.blockStatuses.has(status)) throw new BlockedError(url, status)
    if (status >= 400) throw new Error(`HTTP ${status} for ${url}`)

    await page.waitForSelector('table tr td', { timeout: 20_000 })
    const rows = await page.$$eval('table tr', (trs) =>
      trs.map((tr) => Array.from(tr.children, (cell) => cell.textContent ?? '')),
    )
    const bodyText = await page.evaluate(() => document.body.innerText)

    const { items, skipped } = this.parser.parse(rows)
    if (!items.length) throw new Error(`no price rows parsed from ${url}`)

    const updated = cleanText(bodyText).match(UPDATED_AT_RE)
    return { items, skipped, sourceUpdatedAt: updated ? updated[1] : null, url }
  }

  async getPage() {
    if (this.page) return this.page
    this.context = await this.browser.newContext({ userAgent: USER_AGENT })
    await this.context.route('**/*', (route) => this.filterRequest(route))
    this.page = await this.context.newPage()
    return this.page
  }

  filterRequest(route) {
    const request = route.request()
    const type = request.resourceType()
    if (type === 'document') return route.continue()

    const host = new URL(request.url()).hostname
    const isFirstParty = host === this.originHost || host.endsWith(`.${this.originHost}`)
    return isFirstParty && ALLOWED_SUBRESOURCES.has(type) ? route.continue() : route.abort()
  }

  async close() {
    await this.context?.close()
    this.page = null
    this.context = null
  }
}
