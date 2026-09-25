<script setup>
import { computed, onMounted, ref } from 'vue'
import { getDriedFruitsPrices } from '../services/foodDriedFruitsService.js'

const INITIAL_VISIBLE = 4
const payload = ref(null)
const isLoading = ref(true)
const error = ref(false)
const showAll = ref(false)

const items = computed(() => payload.value?.items || [])
const visibleItems = computed(() => (showAll.value ? items.value : items.value.slice(0, INITIAL_VISIBLE)))
const hasMore = computed(() => !showAll.value && items.value.length > INITIAL_VISIBLE)

function formatPrice(value) {
  return value === null || value === undefined ? '—' : new Intl.NumberFormat('fa-IR').format(value)
}

function toEnglishDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
}

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit])
}

/**
 * The source format is MM/DD/YYYY. The displayed format is DD/MM/YYYY.
 * Example: ۰۲/۰۷/۱۴۰۵ -> ۰۷/۰۲/۱۴۰۵.
 *
 * Important: do not use Number() directly on Persian digits. JavaScript's
 * Number('۰۲') is NaN, so the old UI fallback was returning the original
 * value unchanged.
 */
function formatItemDate(value) {
  const source = String(value ?? '').trim()
  const parts = source.split('/')
  if (parts.length !== 3) return source

  const [sourceMonth, sourceDay, sourceYear] = parts
  const month = toEnglishDigits(sourceMonth).trim()
  const day = toEnglishDigits(sourceDay).trim()
  const year = toEnglishDigits(sourceYear).trim()

  if (!/^\d{1,2}$/.test(month) || !/^\d{1,2}$/.test(day) || !/^\d{4}$/.test(year)) {
    return source
  }

  return `${toPersianDigits(day.padStart(2, '0'))}/${toPersianDigits(month.padStart(2, '0'))}/${toPersianDigits(year)}`
}

function showMore() {
  showAll.value = true
}

onMounted(async () => {
  try {
    payload.value = await getDriedFruitsPrices()
  } catch {
    error.value = true
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <section class="food-section">
    <h2 class="section-title">خشکبار</h2>
    <p v-if="isLoading" class="food-section__state">در حال دریافت قیمت‌ها…</p>
    <p v-else-if="error" class="food-section__state">دریافت قیمت خشکبار ناموفق بود.</p>
    <p v-else-if="!items.length" class="food-section__state">هنوز قیمتی ثبت نشده است.</p>
    <template v-else>
      <div class="food-grid">
        <article v-for="item in visibleItems" :key="item.title" class="food-card">
          <div class="food-card__head"><strong>{{ item.title }}</strong></div>
          <dl class="food-card__meta">
            <div><dt>واحد</dt><dd>{{ item.unit || '—' }}</dd></div>
          </dl>
          <div class="food-card__price">{{ formatPrice(item.price) }} تومان</div>
          <div v-if="item.date" class="food-card__updated">آخرین بروزرسانی: {{ formatItemDate(item.date) }}</div>
        </article>
      </div>
      <button v-if="hasMore" type="button" class="food-section__more" @click="showMore">نمایش همه ({{ items.length - INITIAL_VISIBLE }} مورد دیگر)</button>
    </template>
  </section>
</template>

<style scoped>
.food-section { margin-top: 30px; }
.food-section__state { color: var(--text-muted); text-align: center; padding: 20px 0; }
.food-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.food-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px; }
.food-card__head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:10px; }
.food-card__head strong { font-size:.9rem; line-height:1.35; }
.food-card__meta { margin:0; display:grid; grid-template-columns:1fr; gap:6px; }
.food-card__meta div { min-width:0; }
.food-card__meta dt { color:var(--text-muted); font-size:.65rem; }
.food-card__meta dd { margin:2px 0 0; font-size:.7rem; font-weight:600; }
.food-card__price { margin-top:8px; font-size:.85rem; font-weight:700; }
.food-card__updated { margin-top:6px; font-size:.65rem; color:var(--text-muted); }
.food-section__more { display:block; margin:14px auto 0; padding:8px 20px; border-radius:var(--radius); border:1px solid var(--border); background:var(--card); color:inherit; font-size:.8rem; cursor:pointer; }
.food-section__more:hover { background:var(--border); }
@media (max-width:480px) { .food-grid { grid-template-columns:repeat(auto-fill, minmax(148px,1fr)); gap:10px; } .food-card__meta dd { font-size:.65rem; } }
</style>