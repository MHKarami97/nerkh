<script setup>
/**
 * Detail page for a single asset: current price + a chart with selectable
 * range (day/week from fine-grained snapshots, month/year from the daily
 * summary file — see services/history.js for how each is sourced).
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketStore } from '../stores/market.js'
import { getSymbolHistory } from '../services/history.js'
import { formatDisplayPrice } from '../utils/priceDisplay.js'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../services/categories.js'
import SparklineChart from '../components/SparklineChart.vue'

const RANGE_LABELS = { day: 'روز', week: 'هفته', month: 'ماه', year: 'سال' }

const route = useRoute()
const router = useRouter()
const store = useMarketStore()

const symbol = computed(() => route.params.symbol)
const asset = computed(() => store.assetsBySymbol[symbol.value])
const display = computed(() => (asset.value ? formatDisplayPrice(asset.value) : null))

const range = ref('day')
const points = ref([])
const isLoading = ref(true)

async function loadHistory() {
  isLoading.value = true
  points.value = await getSymbolHistory(symbol.value, range.value)
  isLoading.value = false
}

onMounted(loadHistory)
watch([symbol, range], loadHistory)
</script>

<template>
  <div class="container" style="padding: 20px 16px 48px;">
    <button class="icon-btn" style="width:auto; padding:0 14px;" @click="router.back()">→ بازگشت</button>

    <template v-if="asset">
      <div style="display:flex; align-items:center; gap:10px; margin:18px 0 8px;">
        <span class="asset-card__icon" :style="{ background: `color-mix(in srgb, ${CATEGORY_COLORS[asset.category]} 16%, transparent)` }">
          {{ CATEGORY_ICONS[asset.category] }}
        </span>
        <h1 style="margin:0; font-size:1.4rem;">{{ asset.label }}</h1>
      </div>

      <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:20px;">
        <bdi style="font-size:1.8rem; font-weight:800;">{{ display.text }}</bdi>
        <span style="color:var(--text-muted);">{{ display.unit }}</span>
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <h2 class="section-title" style="margin:0;">نمودار قیمت</h2>
        <div class="range-tabs">
          <button
            v-for="key in ['day', 'week', 'month', 'year']"
            :key="key"
            class="range-tabs__btn"
            :class="{ 'is-active': range === key }"
            @click="range = key"
          >
            {{ RANGE_LABELS[key] }}
          </button>
        </div>
      </div>

      <div class="card" style="padding:16px; margin-top:12px;">
        <SparklineChart v-if="!isLoading" :points="points" :color="CATEGORY_COLORS[asset.category]" />
        <p v-else style="color:var(--text-muted); text-align:center; padding:40px 0;">در حال بارگذاری…</p>
      </div>
    </template>

    <p v-else style="color:var(--text-muted); margin-top:20px;">این آیتم یافت نشد.</p>
  </div>
</template>
