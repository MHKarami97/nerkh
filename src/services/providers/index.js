/**
 * Provider registry + chain-of-responsibility orchestrator.
 *
 * Order matters: providers are tried in array order, first success wins.
 * Adding a future third source is a two-line change: implement the class
 * next to TgjuProvider/MirrorProvider, then append an instance below.
 */
import { TgjuProvider } from './TgjuProvider.js'
import { MirrorProvider } from './MirrorProvider.js'

export const providers = [
  new TgjuProvider(),
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
