<script setup>
/**
 * One category's slice of the home page: pinned items always visible,
 * plus a per-category "show more" toggle that reveals the rest of that
 * category with a smooth expand/collapse animation (pure CSS grid-rows
 * trick, no JS height measuring needed). While the global header search
 * is active, every matching item in the category is shown in one flat
 * grid instead.
 */
import { computed } from 'vue'
import { useMarketStore } from '../stores/market.js'
import { CATEGORY_LABELS } from '../services/categories.js'
import CategorySection from './CategorySection.vue'

const props = defineProps({ category: { type: String, required: true } })
const store = useMarketStore()

const isSearching = computed(() => store.search.trim().length > 0)
const pinned = computed(() => store.pinnedForCategory(props.category))
const extra = computed(() => store.extraForCategory(props.category))
const searchResults = computed(() => store.searchResultsForCategory(props.category))
const hasMore = computed(() => extra.value.length > 0)
const isExpanded = computed(() => !!store.expandedCategories[props.category])
</script>

<template>
  <template v-if="isSearching">
    <div class="grid">
      <CategorySection :assets="searchResults" flat />
    </div>
  </template>

  <template v-else>
    <div class="grid">
      <CategorySection :assets="pinned" flat />
    </div>

    <div v-if="hasMore" class="expand-wrap" :class="{ 'is-open': isExpanded }">
      <div class="expand-wrap__inner">
        <div class="grid" style="margin-top: 14px;">
          <CategorySection :assets="extra" flat />
        </div>
      </div>
    </div>

    <div v-if="hasMore" class="category-more-toggle">
      <button class="card" @click="store.toggleCategoryExpanded(category)">
        {{ isExpanded ? `نمایش کمتر ${CATEGORY_LABELS[category]}` : `نمایش بیشتر ${CATEGORY_LABELS[category]}` }}
      </button>
    </div>
  </template>
</template>
