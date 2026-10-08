<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMarketStore } from '../stores/market.js';
import { getSymbolHistory, HISTORY_RANGES } from '../services/history.js';
import { formatDisplayPrice, toDisplayPrice } from '../utils/priceDisplay.js';
import { getPriceRange, toDisplayValue } from '../utils/priceRange.js';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../services/categories.js';
import PriceHistoryChart from '../components/PriceHistoryChart.vue';

const RANGE_LABELS = {
  week: 'هفتگی',
  month: 'ماهانه',
  year: 'سالانه',
  all: 'همه',
};

const route = useRoute();
const router = useRouter();
const store = useMarketStore();

const symbol = computed(() => route.params.symbol);
const asset = computed(() => store.assetsBySymbol[symbol.value]);
const display = computed(() => (asset.value ? formatDisplayPrice(asset.value) : null));
const unit = computed(() => (asset.value ? toDisplayPrice(asset.value).unit : ''));
const accentColor = computed(() => CATEGORY_COLORS[asset.value?.category] ?? CATEGORY_COLORS.other);
const icon = computed(() => CATEGORY_ICONS[asset.value?.category] ?? CATEGORY_ICONS.other);
const priceRange = computed(() => (asset.value ? getPriceRange(asset.value) : null));
const isFavorite = computed(() => store.favorites.includes(symbol.value));

const range = ref('month');
const history = ref([]);
const isLoading = ref(true);
let requestId = 0;

const chartPoints = computed(() => {
  if (!asset.value) return [];
  return history.value.map((point) => ({ t: point.t, v: toDisplayValue(asset.value, point.p) }));
});

async function loadHistory() {
  const currentRequest = ++requestId;
  const rows = await getSymbolHistory(symbol.value, range.value);
  if (currentRequest !== requestId) return;
  history.value = rows;
  isLoading.value = false;
}

watch([symbol, range], loadHistory, { immediate: true });
watch(() => asset.value?.price, loadHistory);
</script>

<template>
  <div class="container" style="padding: 20px 16px 48px">
    <button type="button" class="icon-btn" style="width: auto; padding: 0 14px" @click="router.back()">
      بازگشت
    </button>

    <template v-if="asset">
      <div style="display: flex; align-items: center; gap: 10px; margin: 18px 0 8px">
        <span
          class="asset-card__icon"
          aria-hidden="true"
          :style="{ background: `color-mix(in srgb, ${accentColor} 16%, transparent)` }"
        >{{ icon }}</span>
        <h1 style="margin: 0; font-size: 1.4rem; flex: 1">{{ asset.label }}</h1>
        <button
          type="button"
          class="asset-card__fav"
          :class="{ 'is-active': isFavorite }"
          :aria-pressed="isFavorite"
          @click="store.toggleFavorite(asset.symbol)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8">
            <path d="m12 20-1.45-1.32C5.4 14 2 10.9 2 7.25A5.25 5.25 0 0 1 7.25 2 5.8 5.8 0 0 1 12 4.65 5.8 5.8 0 0 1 16.75 2 5.25 5.25 0 0 1 22 7.25c0 3.65-3.4 6.75-8.55 11.43L12 20Z" />
          </svg>
        </button>
      </div>

      <div style="display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px 10px; margin-bottom: 14px">
        <bdi style="font-size: 1.8rem; font-weight: 800">{{ display.text }}</bdi>
        <span style="color: var(--text-muted)">{{ display.unit }}</span>
        <span
          v-if="asset.changeDirection !== 'neutral'"
          class="asset-card__badge"
          :class="asset.changeDirection === 'up' ? 'is-up' : 'is-down'"
        >
          {{ asset.changeDirection === 'up' ? '▲' : '▼' }}
          <bdi>{{ Math.abs(asset.changePercent).toFixed(2) }}</bdi>%
        </span>
      </div>

      <dl v-if="priceRange" class="asset-card__range" style="margin-bottom: 14px">
        <div><dt>کمینه</dt><dd>{{ priceRange.min }}</dd></div>
        <div><dt>میانگین</dt><dd>{{ priceRange.average }}</dd></div>
        <div><dt>بیشینه</dt><dd>{{ priceRange.max }}</dd></div>
      </dl>

      <div v-if="asset.foodMeta" class="asset-card__meta" style="margin-bottom: 14px">
        <span v-if="asset.foodMeta.unit">{{ asset.foodMeta.unit }}</span>
        <span v-if="asset.foodMeta.updatedLabel">{{ asset.foodMeta.updatedLabel }}</span>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 24px">
        <h2 class="section-title" style="margin: 0">روند قیمت</h2>
        <div class="range-tabs">
          <button
            v-for="key in HISTORY_RANGES"
            :key="key"
            type="button"
            class="range-tabs__btn"
            :class="{ 'is-active': range === key }"
            @click="range = key"
          >
            {{ RANGE_LABELS[key] }}
          </button>
        </div>
      </div>

      <div class="card" style="padding: 16px; margin-top: 12px">
        <p v-if="isLoading" style="color: var(--text-muted); text-align: center; padding: 40px 0">
          در حال بارگذاری…
        </p>
        <p v-else-if="chartPoints.length < 2" style="color: var(--text-muted); text-align: center; padding: 40px 0">
          برای نمایش نمودار، حداقل در دو روز مختلف قیمت‌ها باید دریافت شده باشند.
        </p>
        <PriceHistoryChart v-else :points="chartPoints" :color="accentColor" :unit="unit" />
      </div>

      <p style="color: var(--text-muted); font-size: 0.8rem; line-height: 1.9; margin-top: 12px">
        داده‌های این نمودار سمت خود شما ذخیره می‌شود: هر بار که قیمت‌ها را دریافت می‌کنید، آخرین قیمت همان روز ثبت می‌شود.
        اگر داده‌ای وجود داشته باشد نمایش داده می‌شود و روزهایی که برنامه را باز نکرده‌اید در نمودار نیست.
      </p>
    </template>

    <p v-else style="color: var(--text-muted); margin-top: 20px">
      این آیتم پیدا نشد یا هنوز در حال بارگذاری است.
    </p>
  </div>
</template>