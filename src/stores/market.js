/** Single client-side state container for market data and UI state. */
import { defineStore } from 'pinia'
import { PINNED_SYMBOL_SET, PINNED_SYMBOLS } from '../services/pinnedSymbols.js'
import { CATEGORY } from '../services/categories.js'
import { getFavorites, setFavorites } from '../services/db.js'

const FOOD_CATEGORY_SET = new Set([
  CATEGORY.FOOD_PRODUCE,
  CATEGORY.FOOD_SHEEP,
  CATEGORY.FOOD_VEAL,
  CATEGORY.FOOD_CHICKEN,
  CATEGORY.FOOD_AQUATIC,
  CATEGORY.FOOD_POULTRY,
  CATEGORY.FOOD_DRIED_FRUITS,
  CATEGORY.FOOD_BEANS,
])
const FOOD_PINNED_COUNT = 4

export const useMarketStore = defineStore('market', {
  state: () => ({
    assetsBySymbol: {},
    favorites: [],
    search: '',
    expandedCategories: {},
    status: 'idle',
    lastSource: null,
    lastUpdatedAt: null,
  }),

  getters: {
    allAssets: (state) => Object.values(state.assetsBySymbol),
    pinnedAssets: (state) => PINNED_SYMBOLS.map((symbol) => state.assetsBySymbol[symbol]).filter(Boolean),
    favoriteAssets: (state) => state.favorites.map((symbol) => state.assetsBySymbol[symbol]).filter(Boolean),

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

    assetsByCategorySorted: (state) => (category) =>
      Object.values(state.assetsBySymbol)
        .filter((asset) => asset.category === category)
        .sort((a, b) => a.label.localeCompare(b.label, 'fa')),

    categoryOrder: () => [
      CATEGORY.CURRENCY,
      CATEGORY.GOLD_COIN,
      CATEGORY.OTHER_METALS,
      CATEGORY.CRYPTO,
      CATEGORY.FUND,
      CATEGORY.GLOBAL_INDEX,
      CATEGORY.FOOD_PRODUCE,
      CATEGORY.FOOD_SHEEP,
      CATEGORY.FOOD_VEAL,
      CATEGORY.FOOD_CHICKEN,
      CATEGORY.FOOD_AQUATIC,
      CATEGORY.FOOD_POULTRY,
      CATEGORY.FOOD_DRIED_FRUITS,
      CATEGORY.FOOD_BEANS,
    ],

    categoryHasAnyAsset: (state) => (category) => Object.values(state.assetsBySymbol).some((asset) => asset.category === category),

    pinnedForCategory() {
      return (category) => {
        if (FOOD_CATEGORY_SET.has(category)) return this.assetsByCategorySorted(category).slice(0, FOOD_PINNED_COUNT)
        return this.pinnedAssets.filter((asset) => asset.category === category)
      }
    },
    extraForCategory() {
      return (category) => {
        if (FOOD_CATEGORY_SET.has(category)) return this.assetsByCategorySorted(category).slice(FOOD_PINNED_COUNT)
        return this.moreAssetsByCategory[category] || []
      }
    },

    searchResultsForCategory() {
      return (category) => {
        const query = this.search.trim().toLowerCase()
        const assets = [...this.pinnedForCategory(category), ...this.extraForCategory(category)]
        if (!query) return assets
        return assets.filter((asset) => asset.label.toLowerCase().includes(query) || asset.symbol.toLowerCase().includes(query))
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

    hydrateFood(assets) {
      const next = { ...this.assetsBySymbol }
      for (const asset of assets) next[asset.symbol] = asset
      this.assetsBySymbol = next
    },
    setStatus(status) { this.status = status },
    setSearch(value) { this.search = value },
    toggleCategoryExpanded(category) {
      this.expandedCategories = { ...this.expandedCategories, [category]: !this.expandedCategories[category] }
    },
    async loadFavoritesFromCache() { this.favorites = await getFavorites() },
    async toggleFavorite(symbol) {
      const exists = this.favorites.includes(symbol)
      this.favorites = exists ? this.favorites.filter((item) => item !== symbol) : [...this.favorites, symbol]
      await setFavorites([...this.favorites])
    },
  },
})
