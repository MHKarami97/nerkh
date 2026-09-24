<script setup>
import { computed, onMounted, ref } from 'vue'
import { getProducePrices } from '../services/produceService.js'

const PAGE_SIZE = 4

const payload = ref(null)
const isLoading = ref(true)
const error = ref(false)
const visibleCount = ref(PAGE_SIZE)
const showAll = ref(false)

const items = computed(() => payload.value?.items || [])
const visibleItems = computed(() => {
  if (showAll.value) return items.value
  return items.value.slice(0, visibleCount.value)
})
const hasMore = computed(() => !showAll.value && visibleCount.value < items.value.length)
const showAllButton = computed(() => !showAll.value && items.value.length - visibleCount.value <= PAGE_SIZE)

function formatPrice(value) {
  return value === null || value === undefined ? '—' : new Intl.NumberFormat('fa-IR').format(value)
}

function showMore() {
  const remaining = items.value.length - visibleCount.value
  if (remaining <= PAGE_SIZE) {
    showAll.value = true
  } else {
    visibleCount.value += PAGE_SIZE
  }
}

onMounted(async () => {
  try {
    payload.value = await getProducePrices()
  } catch {
    error.value = true
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="produce-section">
    <h2 class="section-title">میوه، صیفی‌جات و خشکبار</h2>
    <p v-if="payload?.isExpired" class="produce-section__notice">آخرین فهرست منبع منقضی اعلام شده است؛ قیمت‌ها برای اطلاع نمایش داده می‌شوند.</p>
    <p v-if="isLoading" class="produce-section__state">در حال دریافت قیمت‌ها…</p>
    <p v-else-if="error" class="produce-section__state">دریافت قیمت میوه و خشکبار ناموفق بود.</p>
    <p v-else-if="!items.length" class="produce-section__state">هنوز قیمتی ثبت نشده است.</p>
    <template v-else>
      <div class="produce-grid">
        <article v-for="item in visibleItems" :key="item.id" class="produce-card">
          <div class="produce-card__head">
            <strong>{{ item.title }}</strong>
            <span v-if="item.changePercent !== null" class="produce-card__change" :class="{ 'is-negative': item.changePercent < 0 }">{{ item.changePercent > 0 ? '▲' : item.changePercent < 0 ? '▼' : '—' }} {{ Math.abs(item.changePercent).toFixed(2) }}٪</span>
          </div>
          <dl class="produce-card__prices">
            <div><dt>حداقل</dt><dd>{{ formatPrice(item.minPrice) }} تومان</dd></div>
            <div><dt>حداکثر</dt><dd>{{ formatPrice(item.maxPrice) }} تومان</dd></div>
            <div class="produce-card__average"><dt>میانگین</dt><dd>{{ formatPrice(item.averagePrice) }} تومان</dd></div>
          </dl>
        </article>
      </div>
      <button v-if="hasMore" type="button" class="produce-section__more" @click="showMore">
        {{ showAllButton ? 'نمایش همه' : `نمایش بیشتر (${items.length - visibleCount} مورد دیگر)` }}
      </button>
    </template>
  </section>
</template>

<style scoped>
.produce-section { margin-top: 30px; }
.produce-section__notice { color: #f59e0b; font-size: .8rem; margin: -4px 0 12px; }
.produce-section__state { color: var(--text-muted); text-align: center; padding: 20px 0; }
.produce-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.produce-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px; }
.produce-card__head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:12px; }
.produce-card__head strong { font-size:.9rem; line-height:1.35; }
.produce-card__change { color:var(--up); font-size:.72rem; white-space:nowrap; }
.produce-card__change.is-negative { color:var(--down); }
.produce-card__prices { margin:0; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.produce-card__prices div { min-width:0; }
.produce-card__prices dt { color:var(--text-muted); font-size:.7rem; }
.produce-card__prices dd { margin:3px 0 0; font-size:.78rem; font-weight:600; }
.produce-card__average { grid-column:1/-1; padding-top:7px; border-top:1px solid var(--border); }
.produce-card__average dd { font-size:.9rem; }
.produce-section__more { display:block; margin:14px auto 0; padding:8px 20px; border-radius:var(--radius); border:1px solid var(--border); background:var(--card); color:inherit; font-size:.8rem; cursor:pointer; }
.produce-section__more:hover { background:var(--border); }
@media (max-width:480px) { .produce-grid { grid-template-columns:repeat(auto-fill, minmax(148px,1fr)); gap:10px; } .produce-card__prices dd { font-size:.7rem; } }
</style>
