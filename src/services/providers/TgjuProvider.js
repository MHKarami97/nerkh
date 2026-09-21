import { BaseProvider } from './BaseProvider.js'
import { normalizeTgjuPayload } from '../normalizer.js'

const TGJU_ENDPOINT = 'https://call2.tgju.org/ajax.json'
const TIMEOUT_MS = 6000

/**
 * Primary source: TGJU's public ajax feed, called directly from the
 * browser. Guarded by an AbortController timeout so a slow/broken
 * response doesn't stall the fallback chain.
 */
export class TgjuProvider extends BaseProvider {
  id = 'tgju'

  async fetchAssets() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const response = await fetch(TGJU_ENDPOINT, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(`TGJU HTTP ${response.status}`)
      const payload = await response.json()
      const assets = normalizeTgjuPayload(payload, this.id)
      if (assets.length < 5) throw new Error('TGJU payload had too few usable records')
      return assets
    } finally {
      clearTimeout(timer)
    }
  }
}
