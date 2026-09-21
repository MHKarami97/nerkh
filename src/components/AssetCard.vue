<script setup>
/**
 * Presentational: one asset price tile. Shows label, price, unit, a
 * green/red up/down badge derived from Asset.changeDirection, and a
 * favorite-toggle star. No business logic lives here — everything is
 * props in / events out.
 */
const props = defineProps({
  asset: { type: Object, required: true },
  isFavorite: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-favorite'])

function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(Math.round(value))
}
</script>

<template>
  <article class="card" style="padding: 14px; display:flex; flex-direction:column; gap:8px; min-width:0;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
      <strong style="font-size:0.92rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ asset.label }}</strong>
      <button
        class="icon-btn"
        style="width:30px; height:30px;"
        :aria-pressed="isFavorite"
        :title="isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
        @click="emit('toggle-favorite', asset.symbol)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" :style="{ color: isFavorite ? 'var(--accent)' : 'inherit' }">
          <path d="m12 20-1.45-1.32C5.4 14 2 10.9 2 7.25A5.25 5.25 0 0 1 7.25 2 5.8 5.8 0 0 1 12 4.65 5.8 5.8 0 0 1 16.75 2 5.25 5.25 0 0 1 22 7.25c0 3.65-3.4 6.75-8.55 11.43L12 20Z" />
        </svg>
      </button>
    </div>

    <div style="display:flex; align-items:baseline; gap:6px; flex-wrap:wrap;">
      <bdi style="font-size:1.15rem; font-weight:700;">{{ formatPrice(asset.price) }}</bdi>
      <span style="font-size:0.78rem; color:var(--text-muted);">{{ asset.unit }}</span>
    </div>

    <span
      v-if="asset.changeDirection !== 'neutral'"
      class="badge"
      :class="asset.changeDirection === 'up' ? 'up' : 'down'"
    >
      <span>{{ asset.changeDirection === 'up' ? '▲' : '▼' }}</span>
      <bdi>{{ Math.abs(asset.changePercent).toFixed(2) }}٪</bdi>
    </span>
  </article>
</template>
