/**
 * Contract every market-data provider must implement (duck-typed, no
 * TypeScript in this project, so the contract is documented + enforced
 * at runtime here).
 *
 * To add a new source in the future:
 *   1. Create a class extending BaseProvider.
 *   2. Implement `async fetchAssets()` returning an array of unified
 *      Asset objects (see services/normalizer.js for the shape), or throw
 *      on failure — the chain will move on to the next provider.
 *   3. Register an instance in services/providers/index.js.
 * No other file needs to change; ProviderChain and marketService are
 * completely source-agnostic.
 */
export class BaseProvider {
  id = 'base'

  async fetchAssets() {
    throw new Error('fetchAssets() not implemented')
  }
}
