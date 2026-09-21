/**
 * Provider registry + chain-of-responsibility orchestrator.
 *
 * Order matters: providers are tried in array order, first success wins.
 *   1. TgjuProvider     — primary source (call2.tgju.org/ajax.json)
 *   2. GerdaliProvider  — community GitHub-hosted mirror, used only if TGJU fails
 *   3. MirrorProvider   — this repo's own same-origin snapshot (always available)
 *
 * Adding a future fourth source is a two-line change: implement the class
 * next to the others, then append an instance below.
 */
import { TgjuProvider } from './TgjuProvider.js'
import { GerdaliProvider } from './GerdaliProvider.js'
import { MirrorProvider } from './MirrorProvider.js'

export const providers = [
  new TgjuProvider(),
  new GerdaliProvider(),
  new MirrorProvider(),
  // new SomeFutureProvider(),
]

export async function fetchFromProviderChain() {
  const errors = []
  for (const provider of providers) {
    try {
      const assets = await provider.fetchAssets()
      return { assets, source: provider.id }
    } catch (err) {
      errors.push(`${provider.id}: ${err && err.message ? err.message : err}`)
    }
  }
  throw new Error(`All providers failed -> ${errors.join(' | ')}`)
}
