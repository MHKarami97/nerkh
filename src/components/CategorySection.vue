<script setup>
/**
 * Renders a flat grid of AssetCard for a given list of assets, wired to
 * the store for the favorite toggle so parents don't need to.
 */
import { useMarketStore } from '../stores/market.js'
import AssetCard from './AssetCard.vue'

const props = defineProps({
  assets: { type: Array, default: () => [] },
  flat: { type: Boolean, default: false },
})

const store = useMarketStore()

function isFavorite(symbol) {
  return store.favorites.includes(symbol)
}
</script>

<template>
  <AssetCard
    v-for="asset in assets"
    :key="asset.symbol"
    :asset="asset"
    :is-favorite="isFavorite(asset.symbol)"
    @toggle-favorite="store.toggleFavorite"
  />
</template>
