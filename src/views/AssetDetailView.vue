<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMarketStore } from '../stores/market.js';
import { getSymbolHistory, HISTORY_RANGES, HISTORY_RANGE_LABELS } from '../services/history.js';
import { formatDisplayPrice, toDisplayPrice } from '../utils/priceDisplay.js';
import { getPriceRange, toDisplayValue } from '../utils/priceRange.js';
import { computeStats } from '../utils/chartMath.js';
import { downloadPriceCsv } from '../utils/exportCsv.js';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '../services/categories.js';
import { useChartPreferences } from '../composables/useChartPreferences.js';
import PriceHistoryChart from '../components/PriceHistoryChart.vue';
import PriceStats from '../components/PriceStats.vue';
import RangeTabs from '../components/RangeTabs.vue';

const RANGE_OPTIONS = HISTORY_RANGES.map((key) => ({ key, label: HISTORY_RANGE_LABELS[key] }));
const FEEDBACK_DURATION_MS = 2000;
const updatedFormat = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short' });

const route = useRoute();
const router = useRouter();
const store = useMarketStore();
const preferences = useChartPreferences();

const symbol = computed(() => route.params.symbol);
const asset = computed(() => store.assetsBySymbol[symbol.value]);
const display = computed(() => (asset.value ? formatDisplayPrice(asset.value) : null));
const unit = computed(() => (asset.value ? toDisplayPrice(asset.value).unit : ''));
const accentColor = computed(() => CATEGORY_COLORS[asset.value?.category] ?? CATEGORY_COLORS.other);
const icon = computed(() => CATEGORY_ICONS[asset.value?.category] ?? CATEGORY_ICONS.other);
const categoryLabel = computed(() => CATEGORY_LABELS[asset.value?.category] ?? '');
const priceRange = computed(() => (asset.value ? getPriceRange(asset.value) : null));
const isFavorite = computed(() => store.favorites.includes(symbol.value));
const updatedLabel = computed(() => formatUpdatedAt(asset.value?.updatedAt));

const history = ref([]);
const isLoading = ref(true);
const feedback = ref('');
let requestId = 0;
let feedbackTimer = 0;

const chartPoints = computed(() => {
  if (!asset.value) return [];
  return history.value.map((point) => ({ t: point.t, v: toDisplayValue(asset.value, point.p) }));
});
const stats = computed(() => computeStats(chartPoints.value));
const hasChart = computed(() => chartPoints.value.length >= 2);

function formatUpdatedAt(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : updatedFormat.format(date);
}

async function loadHistory() {
  const currentRequest = ++requestId;
  const rows = await getSymbolHistory(symbol.value, preferences.range);
  if (currentRequest !== requestId) return;
  history.value = rows;
  isLoading.value = false;
}

function goBack() {
  if (window.history.state?.back) router.back();
  else router.push({ name: 'home' });
}

function showFeedback(message) {
  feedback.value = message;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    feedback.value = '';
  }, FEEDBACK_DURATION_MS);
}

async function shareAsset() {
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({
        title: `${asset.value.label} | نرخ`,
        text: `${asset.value.label}: ${display.value.text} ${display.value.unit}`,
        url,
      });
      return;
    }
    await navigator.clipboard.writeText(url);
    showFeedback('لینک کپی شد');
  } catch (error) {
    if (error?.name !== 'AbortError') showFeedback('اشتراک‌گذاری ممکن نشد');
  }
}

function exportCsv() {
  const rows = history.value.map((point) => ({
    date: point.date,
    t: point.t,
    value: toDisplayValue(asset.value, point.p),
  }));
  downloadPriceCsv(`${symbol.value}-${preferences.range}`, rows, unit.value);
}

watch([symbol, () => preferences.range], loadHistory, { immediate: true });
watch(() => asset.value?.price, loadHistory);
onBeforeUnmount(() => clearTimeout(feedbackTimer));
</script>

<template>
  <div class="container detail">
    <button type="button" class="icon-btn detail__back" @click="goBack">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
      بازگشت
    </button>

    <template v-if="asset">
      <section class="detail__hero card" :style="{ '--accent': accentColor }">
        <header class="detail__title-row">
          <span class="asset-card__icon detail__icon" aria-hidden="true">{{ icon }}</span>
          <div class="detail__heading">
            <h1>{{ asset.label }}</h1>
            <span v-if="categoryLabel" class="detail__chip">{{ categoryLabel }}</span>
          </div>
          <div class="detail__actions">
            <button type="button" class="icon-btn" title="اشتراک‌گذاری" aria-label="اشتراک‌گذاری" @click="shareAsset">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
                <path d="M8.2 10.9l7.6-4.4M8.2 13.1l7.6 4.4" />
              </svg>
            </button>
            <button
              type="button"
              class="icon-btn detail__fav"
              :class="{ 'is-active': isFavorite }"
              :aria-pressed="isFavorite"
              :title="isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'"
              @click="store.toggleFavorite(asset.symbol)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="m12 20-1.45-1.32C5.4 14 2 10.9 2 7.25A5.25 5.25 0 0 1 7.25 2 5.8 5.8 0 0 1 12 4.65 5.8 5.8 0 0 1 16.75 2 5.25 5.25 0 0 1 22 7.25c0 3.65-3.4 6.75-8.55 11.43L12 20Z" />
              </svg>
            </button>
          </div>
        </header>

        <div class="detail__price-row">
          <bdi class="detail__price">{{ display.text }}</bdi>
          <span class="detail__unit">{{ display.unit }}</span>
          <span
            v-if="asset.changeDirection !== 'neutral'"
            class="asset-card__badge"
            :class="asset.changeDirection === 'up' ? 'is-up' : 'is-down'"
          >
            {{ asset.changeDirection === 'up' ? '▲' : '▼' }}
            <bdi>{{ Math.abs(asset.changePercent).toFixed(2) }}</bdi>%
          </span>
        </div>

        <dl v-if="priceRange" class="asset-card__range detail__range">
          <div><dt>کمینه</dt><dd>{{ priceRange.min }}</dd></div>
          <div><dt>میانگین</dt><dd>{{ priceRange.average }}</dd></div>
          <div><dt>بیشینه</dt><dd>{{ priceRange.max }}</dd></div>
        </dl>

        <div v-if="asset.foodMeta" class="asset-card__meta">
          <span v-if="asset.foodMeta.unit">{{ asset.foodMeta.unit }}</span>
          <span v-if="asset.foodMeta.updatedLabel">{{ asset.foodMeta.updatedLabel }}</span>
        </div>

        <p v-if="updatedLabel" class="detail__updated">آخرین بروزرسانی: {{ updatedLabel }}</p>
      </section>

      <div class="detail__section-head">
        <h2 class="section-title">روند قیمت</h2>
        <RangeTabs v-model="preferences.range" :options="RANGE_OPTIONS" />
      </div>

      <div class="card detail__chart">
        <p v-if="isLoading" class="detail__empty">در حال بارگذاری…</p>
        <p v-else-if="!hasChart" class="detail__empty">
          برای نمایش نمودار، قیمت‌ها باید حداقل در دو روز مختلف دریافت شده باشند.
        </p>
        <PriceHistoryChart v-else :points="chartPoints" :stats="stats" :color="accentColor" :unit="unit" />
      </div>

      <PriceStats v-if="hasChart" :stats="stats" :unit="unit" />

      <div class="detail__footer">
        <button type="button" class="detail__export" :disabled="!history.length" @click="exportCsv">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          دانلود CSV
        </button>
        <p class="detail__note">
          تاریخچه فقط روی همین دستگاه ذخیره می‌شود: هر بار که قیمت‌ها دریافت شوند، آخرین قیمت همان روز ثبت می‌شود.
          روزهایی که برنامه باز نشده در نمودار وجود ندارد.
        </p>
      </div>
    </template>

    <p v-else class="detail__empty detail__empty--page">این آیتم پیدا نشد یا هنوز در حال بارگذاری است.</p>

    <Transition name="toast">
      <div v-if="feedback" class="detail__toast card" role="status">{{ feedback }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.detail {
  padding-top: 20px;
  padding-bottom: 48px;
}

.detail__back {
  width: auto;
  gap: 6px;
  padding: 0 14px;
  font-size: 0.85rem;
}

.detail__hero {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
  padding: 18px 18px 16px;
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%),
    var(--card);
}

.detail__hero::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--accent);
}

.detail__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  font-size: 1.4rem;
}

.detail__heading {
  flex: 1;
  min-width: 0;
}

.detail__heading h1 {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.detail__chip {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}

.detail__actions {
  display: flex;
  gap: 8px;
}

.detail__fav.is-active {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}

.detail__price-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
}

.detail__price {
  font-size: clamp(1.7rem, 6vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.detail__unit {
  color: var(--text-muted);
}

.detail__range {
  max-width: 420px;
}

.detail__updated {
  margin: 0;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.detail__section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 22px;
}

.detail__section-head .section-title {
  margin: 0;
}

.detail__chart {
  margin-top: 12px;
  padding: 14px 14px 10px;
}

.detail__empty {
  margin: 0;
  padding: 40px 0;
  text-align: center;
  line-height: 1.9;
  color: var(--text-muted);
}

.detail__empty--page {
  margin-top: 20px;
  padding: 0;
  text-align: start;
}

.detail__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px 16px;
  margin-top: 16px;
}

.detail__export {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-elevated);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.detail__export:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.detail__note {
  flex: 1 1 280px;
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.9;
  color: var(--text-muted);
}

.detail__toast {
  position: fixed;
  bottom: 18px;
  left: 50%;
  z-index: 60;
  padding: 10px 18px;
  font-size: 0.85rem;
  transform: translateX(-50%);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .detail {
    padding-top: 14px;
  }

  .detail__hero {
    padding: 14px 14px 12px;
  }

  .detail__chart {
    padding: 10px 8px 8px;
  }
}
</style>
