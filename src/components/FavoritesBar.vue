<script setup>
/**
 * Favorited assets, rendered above the main content whenever there's at
 * least one favorite. Uses the same responsive grid as every other
 * category section (not a horizontal scroll strip) so it looks and
 * behaves consistently on mobile too.
 */
import { useMarketStore } from '../stores/market.js'
import CategorySection from './CategorySection.vue'

const store = useMarketStore()
</script>

<template>
  <section style="margin-top: 10px;">
    <h2 class="section-title" style="margin-top:0;">مورد علاقه‌ها</h2>
    <div class="grid">
      <CategorySection :assets="store.favoriteAssets" flat />
    </div>
  </section>
</template>
