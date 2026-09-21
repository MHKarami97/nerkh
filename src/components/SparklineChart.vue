<script setup>
/**
 * Minimal dependency-free SVG line chart for one asset's daily history.
 * Kept hand-rolled (no charting library) to avoid adding a runtime
 * dependency just for a single sparkline-style view.
 */
import { computed } from 'vue'

const props = defineProps({
  points: { type: Array, default: () => [] }, // [{ t: isoString, p: number }]
  color: { type: String, default: '#4a89ff' },
})

const width = 640
const height = 220
const padding = 14

const path = computed(() => {
  if (props.points.length < 2) return ''
  const values = props.points.map((p) => p.p)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = (width - padding * 2) / (props.points.length - 1)
  return props.points
    .map((p, i) => {
      const x = padding + i * stepX
      const y = height - padding - ((p.p - min) / range) * (height - padding * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const summary = computed(() => {
  if (!props.points.length) return null
  const values = props.points.map((p) => p.p)
  return {
    min: new Intl.NumberFormat('fa-IR').format(Math.round(Math.min(...values))),
    max: new Intl.NumberFormat('fa-IR').format(Math.round(Math.max(...values))),
  }
})
</script>

<template>
  <div>
    <svg v-if="path" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" width="100%" :height="height" class="sparkline">
      <path :d="path" fill="none" :stroke="color" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
    <p v-else style="color:var(--text-muted); text-align:center; padding:40px 0;">
      داده‌ی تاریخی کافی برای رسم نمودار امروز هنوز ثبت نشده است.
    </p>

    <div v-if="summary" class="sparkline__range">
      <span>کمینه: {{ summary.min }}</span>
      <span>بیشینه: {{ summary.max }}</span>
    </div>
  </div>
</template>
