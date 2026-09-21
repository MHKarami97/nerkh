/**
 * Pinia store: the single client-side state container for market data,
 * UI filters (search, favorites) and refresh status. Components only ever
 * read/write through this store — they never touch services/db.js or the
 * provider chain directly (keeps components trivially testable).
 */
import { defineStore } from 'pinia'
import { PINNED_SYMBOL_SET, PINNED_SYMBOLS } from '../services/pinnedSymbols.js'
import { CATEGORY } from '../services/categories.js'
import { getFavorites, setFavorites } from '../services/db.js'

export const useMarketStore = defineStore('market', {
  state: () => ({
    assetsBySymbol: {},
    favorites: [],
    search: '',
    isMoreOpen: false,
    status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
    lastSource: null,
    lastUpdatedAt: null,
  }),

  getters: {
    allAssets: (state) => Object.values(state.assetsBySymbol),

    pinnedAssets: (state) =>
      PINNED_SYMBOLS.map((symbol) => state.assetsBySymbol[symbol]).filter(Boolean),

    favoriteAssets: (state) =>
      state.favorites.map((symbol) => state.assetsBySymbol[symbol]).filter(Boolean),

    /** Everything NOT pinned, grouped by category, for the "more assets" dialog. */
    moreAssetsByCategory: (state) => {
      const groups = {}
      for (const asset of Object.values(state.assetsBySymbol)) {
        if (PINNED_SYMBOL_SET.has(asset.symbol)) continue
        if (!groups[asset.category]) groups[asset.category] = []
        groups[asset.category].push(asset)
      }
      Object.values(groups).forEach((list) => list.sort((a, b) => a.label.localeCompare(b.label, 'fa')))
      return groups
    },

    /** Full-text search across every known asset (pinned + more), used by the header search box. */
    searchResults: (state) => {
      const query = state.search.trim().toLowerCase()
      if (!query) return []
      return Object.values(state.assetsBySymbol)
        .filter((asset) => asset.label.toLowerCase().includes(query) || asset.symbol.toLowerCase().includes(query))
        .sort((a, b) => a.label.localeCompare(b.label, 'fa'))
    },

    categoryOrder: () => [CATEGORY.CURRENCY, CATEGORY.GOLD_COIN, CATEGORY.CRYPTO, CATEGORY.GLOBAL_INDEX, CATEGORY.FUND, CATEGORY.OTHER],
  },

  actions: {
    /** Merge a batch of normalized assets into the map (called by marketService). */
    hydrate(assets, { source, updatedAt } = {}) {
      const next = { ...this.assetsBySymbol }
      for (const asset of assets) next[asset.symbol] = asset
      this.assetsBySymbol = next
      if (source) this.lastSource = source
      if (updatedAt) this.lastUpdatedAt = updatedAt
    },

    setStatus(status) {
      this.status = status
    },

    setSearch(value) {
      this.search = value
    },

    toggleMore(open) {
      this.isMoreOpen = open ?? !this.isMoreOpen
    },

    async loadFavoritesFromCache() {
      this.favorites = await getFavorites()
    },

    async toggleFavorite(symbol) {
      const isFavorite = this.favorites.includes(symbol)
      this.favorites = isFavorite ? this.favorites.filter((s) => s !== symbol) : [...this.favorites, symbol]
      await setFavorites(this.favorites)
    },
  },
})
