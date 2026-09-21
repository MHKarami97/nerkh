<script setup>
/**
 * Root shell: wires the store, market service lifecycle, and lays out the
 * header, favorites bar, pinned grid (by category), and the inline
 * "more assets" section (expands in the same page, not a modal).
 */
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useMarketStore } from './stores/market.js'
import { MarketService } from './services/marketService.js'
import { CATEGORY_LABELS } from './services/categories.js'
import AppHeader from './components/AppHeader.vue'
import FavoritesBar from './components/FavoritesBar.vue'
import CategorySection from './components/CategorySection.vue'
import MoreAssetsSection from './components/MoreAssetsSection.vue'
import UpdateToast from './components/UpdateToast.vue'

const store = useMarketStore()
let marketService = null

const pinnedByCategory = computed(() => {
  const groups = {}
  for (const asset of store.pinnedAssets) {
    if (!groups[asset.category]) groups[asset.category] = []
    groups[asset.category].push(asset)
  }
  return groups
})

const visibleCategoryOrder = computed(() =>
  store.categoryOrder.filter((category) => (pinnedByCategory.value[category] || []).length > 0)
)

onMounted(async () => {
  await store.loadFavoritesFromCache()
  marketService = new MarketService(store)
  await marketService.init()
})

onBeforeUnmount(() => {
  marketService?.dispose()
})
</script>

<template>
  <AppHeader />

  <main class="container" style="flex: 1; padding-bottom: 48px;">
    <FavoritesBar v-if="store.favoriteAssets.length" />

    <template v-if="store.search.trim()">
      <h2 class="section-title">نتایج جستجو</h2>
      <div class="grid">
        <CategorySection :assets="store.searchResults" flat />
      </div>
    </template>

    <template v-else>
      <template v-for="category in visibleCategoryOrder" :key="category">
        <h2 class="section-title">{{ CATEGORY_LABELS[category] }}</h2>
        <div class="grid">
          <CategorySection :assets="pinnedByCategory[category]" flat />
        </div>
      </template>

      <div style="display:flex; justify-content:center; margin-top: 28px;">
        <button class="card" style="padding: 10px 22px; cursor:pointer; color: var(--text); font-weight:600;" @click="store.toggleMore()">
          {{ store.isMoreOpen ? 'نمایش کمتر' : 'نمایش بیشتر ارزها و دارایی‌ها' }}
        </button>
      </div>

      <MoreAssetsSection v-if="store.isMoreOpen" />
    </template>
  </main>

  <UpdateToast />
</template>
