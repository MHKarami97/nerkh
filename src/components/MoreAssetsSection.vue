<script setup>
/**
 * Inline "show more" experience: every non-pinned asset, grouped by
 * category with its own local text filter. Rendered directly in the page
 * flow below the pinned grid (not a modal/overlay), per product
 * requirement.
 */
import { computed, ref } from 'vue'
import { useMarketStore } from '../stores/market.js'
import { CATEGORY_LABELS } from '../services/categories.js'
import CategorySection from './CategorySection.vue'

const store = useMarketStore()
const localQuery = ref('')

const filteredGroups = computed(() => {
  const query = localQuery.value.trim().toLowerCase()
  const groups = store.moreAssetsByCategory
  if (!query) return groups
  const filtered = {}
  for (const [category, assets] of Object.entries(groups)) {
    const matches = assets.filter((a) => a.label.toLowerCase().includes(query) || a.symbol.toLowerCase().includes(query))
    if (matches.length) filtered[category] = matches
  }
  return filtered
})
</script>

<template>
  <section class="more-section">
    <h2 class="section-title" style="margin-top:0;">همه ارزها و دارایی‌ها</h2>

    <input
      v-model="localQuery"
      type="search"
      placeholder="جستجو در این لیست..."
      class="more-section__search"
    />

    <template v-for="(assets, category) in filteredGroups" :key="category">
      <h3 class="section-title" style="font-size:0.95rem;">{{ CATEGORY_LABELS[category] || category }}</h3>
      <div class="grid">
        <CategorySection :assets="assets" flat />
      </div>
    </template>

    <p v-if="!Object.keys(filteredGroups).length" style="color:var(--text-muted); text-align:center; padding:24px 0;">
      موردی یافت نشد.
    </p>
  </section>
</template>
