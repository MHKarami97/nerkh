<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketStore } from '../stores/market.js'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../services/categories.js'
import { toDisplayPrice, formatDisplayPrice } from '../utils/priceDisplay.js'

const CARD_NAVIGATION_ENABLED = false

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

// Reuses the same Rial->Toman (or USD/no-unit) conversion the main price
// already goes through, just applied to the min/average/max instead of
// asset.price, so the three numbers always share the exact same unit logic.
function formatRangeValue(rawPrice) {
  if (rawPrice === null || rawPrice === undefined) return null
  const { value } = toDisplayPrice({ ...props.asset, price: rawPrice })
  return new Intl.NumberFormat('fa-IR').format(Math.round(value))
}

const priceRange = computed(() => {
  const range = props.asset.priceRange
  if (!range) return null
  return {
    min: formatRangeValue(range.min),
    average: formatRangeValue(range.average),
    max: formatRangeValue(range.max),
  }
})

function openDetail() {
  if (!CARD_NAVIGATION_ENABLED) return
  store.setSearch('')
  router.push({ name: 'asset-detail', params: { symbol: props.asset.symbol } })
}
</script>

<template>
  <article
    class="asset-card"
    :class="{ 'is-static': !CARD_NAVIGATION_ENABLED }"
    :style="{ '--accent': accentColor }"
    @click="openDetail"
  >
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

    <dl v-if="priceRange" class="asset-card__range">
      <div>
        <dt>حداقل</dt>
        <dd>{{ priceRange.min }}</dd>
      </div>
      <div>
        <dt>میانگین</dt>
        <dd>{{ priceRange.average }}</dd>
      </div>
      <div>
        <dt>حداکثر</dt>
        <dd>{{ priceRange.max }}</dd>
      </div>
    </dl>

    <div v-if="asset.foodMeta" class="asset-card__meta">
      <span v-if="asset.foodMeta.unit">{{ asset.foodMeta.unit }}</span>
      <span v-if="asset.foodMeta.updatedLabel">{{ asset.foodMeta.updatedLabel }}</span>
    </div>
  </article>
</template>
