<script setup>
/**
 * One category's slice of the home page: pinned items always visible,
 * plus a per-category "show more" toggle that reveals the rest of that
 * category inline. While the global header search is active, every
 * matching item in the category is shown regardless of expand state.
 */
import { computed } from 'vue'
import { useMarketStore } from '../stores/market.js'
import { CATEGORY_LABELS } from '../services/categories.js'
import CategorySection from './CategorySection.vue'

const props = defineProps({ category: { type: String, required: true } })
const store = useMarketStore()

const isSearching = computed(() => store.search.trim().length > 0)
const assets = computed(() => store.visibleAssetsForCategory(props.category))
const hasMore = computed(() => (store.moreAssetsByCategory[props.category] || []).length > 0)
const isExpanded = computed(() => !!store.expandedCategories[props.category])
</script>

<template>
  <div class="grid">
    <CategorySection :assets="assets" flat />
  </div>

  <div v-if="hasMore && !isSearching" class="category-more-toggle">
    <button class="card" @click="store.toggleCategoryExpanded(category)">
      {{ isExpanded ? `نمایش کمتر ${CATEGORY_LABELS[category]}` : `نمایش بیشتر ${CATEGORY_LABELS[category]}` }}
    </button>
  </div>
</template>
