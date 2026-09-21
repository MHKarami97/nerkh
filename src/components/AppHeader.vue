<script setup>
/**
 * Top bar: site icon + name, the single global search input (filters
 * every category block at once), and the theme toggle. Status line shows
 * loading/error state, the 1-minute auto-refresh cadence, and a relative
 * "updated x ago" label.
 */
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useMarketStore } from '../stores/market.js'
import ThemeToggle from './ThemeToggle.vue'

const store = useMarketStore()
const now = ref(Date.now())
let tickId = null

onMounted(() => {
  tickId = setInterval(() => { now.value = Date.now() }, 15_000)
})
onBeforeUnmount(() => clearInterval(tickId))

const updatedAgoLabel = computed(() => {
  if (!store.lastUpdatedAt) return '—'
  const diffSec = Math.max(0, Math.round((now.value - new Date(store.lastUpdatedAt).getTime()) / 1000))
  if (diffSec < 60) return 'چند لحظه پیش'
  const diffMin = Math.round(diffSec / 60)
  return `${diffMin} دقیقه پیش`
})
</script>

<template>
  <header class="container app-header">
    <div class="app-header__row">
      <img src="/icons/icon.svg" alt="نرخ" class="app-header__logo" />
      <h1 class="app-header__title">نرخ</h1>

      <div class="app-header__search-wrap">
        <input
          type="search"
          :value="store.search"
          @input="store.setSearch($event.target.value)"
          placeholder="جستجوی ارز، طلا، سکه یا رمزارز..."
          class="card app-header__search"
        />
      </div>

      <ThemeToggle />
    </div>

    <div class="app-header__status">
      <span>{{ store.status === 'loading' ? 'در حال بروزرسانی…' : store.status === 'error' ? 'خطا در دریافت داده جدید (نمایش آخرین داده معتبر)' : 'بروز' }}</span>
      <span>· بروزرسانی خودکار هر ۱ دقیقه</span>
      <span>· آخرین بروزرسانی: {{ updatedAgoLabel }}</span>
    </div>
  </header>
</template>
