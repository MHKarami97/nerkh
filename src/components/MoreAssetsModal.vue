<script setup>
/**
 * Full "show more" experience: every non-pinned asset, grouped by category
 * with its own local text filter (independent of the header search so
 * users can narrow the modal without leaving the page context).
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

function close() {
  store.toggleMore(false)
}
</script>

<template>
  <div style="position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:50; display:flex; align-items:flex-end; justify-content:center;" @click.self="close">
    <div class="card" style="width:100%; max-width:900px; max-height:85vh; overflow-y:auto; border-bottom-left-radius:0; border-bottom-right-radius:0; padding:18px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <h2 style="margin:0; font-size:1.05rem;">همه ارزها و دارایی‌ها</h2>
        <button class="icon-btn" title="بستن" @click="close">✕</button>
      </div>

      <input
        v-model="localQuery"
        type="search"
        placeholder="جستجو در این لیست..."
        class="card"
        style="width:100%; margin-top:12px; padding:10px 14px; border:none; outline:none; color:var(--text); background:var(--bg-elevated);"
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
    </div>
  </div>
</template>
