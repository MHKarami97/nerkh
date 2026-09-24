<script setup>
import { computed } from 'vue'
import { useMarketStore } from '../stores/market.js'
import { CATEGORY_LABELS } from '../services/categories.js'
import FavoritesBar from '../components/FavoritesBar.vue'
import CategoryBlock from '../components/CategoryBlock.vue'
import ProduceSection from '../components/ProduceSection.vue'

const store = useMarketStore()
const categoriesWithData = computed(() =>
  store.categoryOrder.filter((category) => store.categoryHasAnyAsset(category))
)
</script>

<template>
  <main class="container" style="flex: 1; padding-bottom: 48px;">
    <FavoritesBar v-if="store.favoriteAssets.length" />
    <template v-for="category in categoriesWithData" :key="category">
      <h2 class="section-title">{{ CATEGORY_LABELS[category] }}</h2>
      <CategoryBlock :category="category" />
    </template>
    <ProduceSection />
  </main>
</template>
