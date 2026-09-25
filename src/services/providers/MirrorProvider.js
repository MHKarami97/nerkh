import { BaseProvider } from './BaseProvider.js'

const TIMEOUT_MS = 5000
const RAW_URL = 'https://raw.githubusercontent.com/MHKarami97/nerkh/main/public/data/latest.json'

/**
 * Fallback source: a same-origin JSON snapshot committed to this very
 * repository by the `.github/workflows/fetch-data.yml` scheduled job
 * (runs every 5 minutes, calls TGJU server-side where CORS/rate-limits
 * don't apply, and writes public/data/latest.json).
 *
 * Because it is served from the same domain as the app
 * (nerkh.mhkarami97.ir), it never hits a CORS wall and is a
 * guaranteed-available fallback if the direct TGJU call ever gets blocked
 * from the browser. This mirrors the technique used by the reference site
 * (narkh.ir) for its own upstream GitHub-hosted fallback.
 */
export class MirrorProvider extends BaseProvider {
  id = 'mirror'

  async fetchAssets() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const url = `${RAW_URL}?ts=${Date.now()}`
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(`Mirror HTTP ${response.status}`)
      const payload = await response.json()
      const assets = Array.isArray(payload.assets) ? payload.assets : []
      if (assets.length < 5) throw new Error('Mirror payload had too few usable records')
      return assets.map((asset) => ({ ...asset, source: this.id }))
    } finally {
      clearTimeout(timer)
    }
  }
}
