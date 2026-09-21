<script setup>
/**
 * Horizontal, always-visible strip of the user's favorited assets,
 * rendered above the main content whenever there's at least one favorite.
 */
import { useMarketStore } from '../stores/market.js'
import AssetCard from './AssetCard.vue'

const store = useMarketStore()
</script>

<template>
  <section style="margin-top: 10px;">
    <h2 class="section-title" style="margin-top:0;">مورد علاقه‌ها</h2>
    <div class="scroll-row">
      <div v-for="asset in store.favoriteAssets" :key="asset.symbol" style="min-width:200px;">
        <AssetCard :asset="asset" is-favorite @toggle-favorite="store.toggleFavorite" />
      </div>
    </div>
  </section>
</template>
