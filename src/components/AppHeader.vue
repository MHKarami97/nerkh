<script setup>
/**
 * Top bar: brand, search input (drives store.search across ALL assets),
 * and the theme toggle. Also shows a tiny status line with the active
 * data source + a relative "updated x ago" label so users can see whether
 * they are looking at live TGJU data or the cached mirror/offline fallback.
 */
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useMarketStore } from '../stores/market.js'
import ThemeToggle from './ThemeToggle.vue'

const store = useMarketStore()
const now = ref(Date.now())
let tickId = null

onMounted(() => {
  tickId = setInterval(() => { now.value = Date.now() }, 30_000)
})
onBeforeUnmount(() => clearInterval(tickId))

const sourceLabel = computed(() => ({
  tgju: 'TGJU',
  mirror: 'آینه (Mirror)',
  cache: 'حافظه محلی',
}[store.lastSource] || '—'))

const updatedAgoLabel = computed(() => {
  if (!store.lastUpdatedAt) return '—'
  const diffSec = Math.max(0, Math.round((now.value - new Date(store.lastUpdatedAt).getTime()) / 1000))
  if (diffSec < 60) return 'چند لحظه پیش'
  const diffMin = Math.round(diffSec / 60)
  return `${diffMin} دقیقه پیش`
})
</script>

<template>
  <header class="container" style="padding-top:18px; padding-bottom:10px;">
    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
      <h1 style="font-size:1.3rem; margin:0; flex:1; min-width:160px;">نرخ</h1>

      <div style="flex:2; min-width:220px;">
        <input
          type="search"
          :value="store.search"
          @input="store.setSearch($event.target.value)"
          placeholder="جستجوی ارز، طلا، سکه یا رمزارز..."
          class="card"
          style="width:100%; padding:10px 14px; border:none; outline:none; color:var(--text); background:var(--bg-elevated);"
        />
      </div>

      <ThemeToggle />
    </div>

    <div style="margin-top:8px; font-size:0.75rem; color:var(--text-muted); display:flex; gap:10px; flex-wrap:wrap;">
      <span>وضعیت: {{ store.status === 'loading' ? 'در حال به‌روزرسانی…' : store.status === 'error' ? 'خطا در دریافت داده جدید (نمایش آخرین داده معتبر)' : 'به‌روز' }}</span>
      <span>· منبع: {{ sourceLabel }}</span>
      <span>· بروزرسانی: {{ updatedAgoLabel }}</span>
    </div>
  </header>
</template>
