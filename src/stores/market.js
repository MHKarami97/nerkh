/**
 * Pinia store: the single client-side state container for market data,
 * UI filters (search, per-category expand state, favorites) and refresh
 * status. Components only ever read/write through this store.
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
    expandedCategories: {},
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

    /** Non-pinned assets grouped by category, used by each category's "show more". */
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

    categoryOrder: () => [CATEGORY.CURRENCY, CATEGORY.GOLD_COIN, CATEGORY.CRYPTO, CATEGORY.GLOBAL_INDEX, CATEGORY.FUND, CATEGORY.OTHER],

    categoryHasAnyAsset: (state) => (category) => {
      const pinnedInCategory = PINNED_SYMBOLS.some(
        (symbol) => state.assetsBySymbol[symbol] && state.assetsBySymbol[symbol].category === category
      )
      const hasMore = Object.values(state.assetsBySymbol).some(
        (a) => a.category === category && !PINNED_SYMBOL_SET.has(a.symbol)
      )
      return pinnedInCategory || hasMore
    },

    /** Pinned assets belonging to one category — the part that's always visible. */
    pinnedForCategory() {
      return (category) => this.pinnedAssets.filter((a) => a.category === category)
    },

    /** Non-pinned assets belonging to one category — revealed by "show more". */
    extraForCategory() {
      return (category) => this.moreAssetsByCategory[category] || []
    },

    /** Every asset (pinned or not) in a category that matches the active search query. */
    searchResultsForCategory() {
      return (category) => {
        const query = this.search.trim().toLowerCase()
        const combined = [...this.pinnedForCategory(category), ...this.extraForCategory(category)]
        if (!query) return combined
        return combined.filter((a) => a.label.toLowerCase().includes(query) || a.symbol.toLowerCase().includes(query))
      }
    },
  },

  actions: {
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

    toggleCategoryExpanded(category) {
      this.expandedCategories = { ...this.expandedCategories, [category]: !this.expandedCategories[category] }
    },

    async loadFavoritesFromCache() {
      this.favorites = await getFavorites()
    },

    async toggleFavorite(symbol) {
      const isFavorite = this.favorites.includes(symbol)
      this.favorites = isFavorite ? this.favorites.filter((s) => s !== symbol) : [...this.favorites, symbol]
      // IndexedDB's structured-clone algorithm cannot serialize a Vue
      // reactive Proxy directly (causes "DataCloneError: ... could not be
      // cloned"). Spreading into a plain array before persisting avoids it.
      await setFavorites([...this.favorites])
    },
  },
})
