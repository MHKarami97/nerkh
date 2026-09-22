<script setup>
/**
 * Presentational: one asset price tile. Clicking anywhere on the card
 * (except the favorite star) clears any active search and opens the
 * asset's detail page — otherwise the leftover search query would still
 * be showing (and filtering) when the user comes back to the home page.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketStore } from '../stores/market.js'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../services/categories.js'
import { formatDisplayPrice } from '../utils/priceDisplay.js'

const props = defineProps({
  asset: { type: Object, required: true },
  isFavorite: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-favorite'])
const router = useRouter()
const store = useMarketStore()

const accentColor = computed(() => CATEGORY_COLORS[props.asset.category] || CATEGORY_COLORS.other)
const icon = computed(() => CATEGORY_ICONS[props.asset.category] || CATEGORY_ICONS.other)
const display = computed(() => formatDisplayPrice(props.asset))

function openDetail() {
  store.setSearch('')
  router.push({ name: 'asset-detail', params: { symbol: props.asset.symbol } })
}
</script>

<template>
  <article class="asset-card" :style="{ '--accent': accentColor }" @click="openDetail">
    <div class="asset-card__head">
      <span class="asset-card__icon" aria-hidden="true">{{ icon }}</span>
      <strong class="asset-card__label">{{ asset.label }}</strong>
      <button
        type="button"
        class="asset-card__fav"
        :class="{ 'is-active': isFavorite }"
        :aria-pressed="isFavorite"
        :title="isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
        @click.stop="emit('toggle-favorite', asset.symbol)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8">
          <path d="m12 20-1.45-1.32C5.4 14 2 10.9 2 7.25A5.25 5.25 0 0 1 7.25 2 5.8 5.8 0 0 1 12 4.65 5.8 5.8 0 0 1 16.75 2 5.25 5.25 0 0 1 22 7.25c0 3.65-3.4 6.75-8.55 11.43L12 20Z" />
        </svg>
      </button>
    </div>

    <div class="asset-card__price-row">
      <bdi class="asset-card__price">{{ display.text }}</bdi>
      <span class="asset-card__unit">{{ display.unit }}</span>
    </div>

    <span
      v-if="asset.changeDirection !== 'neutral'"
      class="asset-card__badge"
      :class="asset.changeDirection === 'up' ? 'is-up' : 'is-down'"
    >
      <span>{{ asset.changeDirection === 'up' ? '▲' : '▼' }}</span>
      <bdi>{{ Math.abs(asset.changePercent).toFixed(2) }}٪</bdi>
    </span>
  </article>
</template>
