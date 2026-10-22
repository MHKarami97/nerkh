<script setup>
import { computed } from 'vue';

const props = defineProps({
  stats: { type: Object, required: true },
  unit: { type: String, default: '' },
});

const dateFormat = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium' });
const wholeFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });
const fractionFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });
const signedFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2, signDisplay: 'exceptZero' });

const formatValue = (value) => (Math.abs(value) >= 100 ? wholeFormat : fractionFormat).format(value);

const tone = computed(() => (props.stats.change > 0 ? 'up' : props.stats.change < 0 ? 'down' : 'flat'));
const positionPercent = computed(() => Math.round(props.stats.position * 100));

const items = computed(() => {
  const { stats } = props;
  return [
    {
      key: 'change',
      label: 'تغییر بازه',
      value: `${signedFormat.format(stats.changePercent)}٪`,
      hint: `${signedFormat.format(stats.change)} ${props.unit}`,
      tone: tone.value,
    },
    { key: 'high', label: 'بیشترین', value: formatValue(stats.max.v), hint: dateFormat.format(stats.max.t) },
    { key: 'low', label: 'کمترین', value: formatValue(stats.min.v), hint: dateFormat.format(stats.min.t) },
    {
      key: 'average',
      label: 'میانگین',
      value: formatValue(stats.average),
      hint: `${wholeFormat.format(stats.count)} روز ثبت‌شده`,
    },
    {
      key: 'volatility',
      label: 'نوسان',
      value: `${fractionFormat.format(stats.volatility)}٪`,
      hint: 'انحراف معیار تغییر بین دو ثبت',
    },
  ];
});
</script>

<template>
  <section class="stats" aria-label="آمار بازه انتخاب‌شده">
    <dl class="stats__grid">
      <div v-for="item in items" :key="item.key" class="stats__item" :class="item.tone && `is-${item.tone}`">
        <dt>{{ item.label }}</dt>
        <dd dir="ltr"><bdi>{{ item.value }}</bdi></dd>
        <small>{{ item.hint }}</small>
      </div>
    </dl>

    <div class="stats__position">
      <div class="stats__position-head">
        <span>جایگاه قیمت فعلی در بازه</span>
        <strong>{{ wholeFormat.format(positionPercent) }}٪</strong>
      </div>
      <div class="stats__bar" dir="ltr" role="meter" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="positionPercent">
        <span class="stats__bar-thumb" :style="{ left: `calc(${positionPercent}% - 6px)` }"></span>
      </div>
      <div class="stats__position-foot" dir="ltr">
        <span>کمترین <bdi>{{ formatValue(stats.min.v) }}</bdi></span>
        <span>بیشترین <bdi>{{ formatValue(stats.max.v) }}</bdi></span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats {
  margin-top: 14px;
}

.stats__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin: 0;
}

.stats__item {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
}

.stats__item dt {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.stats__item dd {
  margin: 4px 0 2px;
  font-size: 1.05rem;
  font-weight: 800;
  text-align: start;
  overflow-wrap: anywhere;
}

.stats__item small {
  display: block;
  font-size: 0.68rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.stats__item.is-up dd { color: var(--up); }
.stats__item.is-down dd { color: var(--down); }

.stats__position {
  margin-top: 10px;
  padding: 12px 14px 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
}

.stats__position-head,
.stats__position-foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.stats__position-head strong {
  color: var(--text);
}

.stats__bar {
  position: relative;
  height: 6px;
  margin: 10px 0 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--down), var(--text-muted), var(--up));
  opacity: 0.9;
}

.stats__bar-thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translateY(-50%);
  background: var(--card);
  border: 3px solid var(--text);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

@media (max-width: 480px) {
  .stats__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .stats__item {
    padding: 10px 12px;
  }

  .stats__item:first-child {
    grid-column: 1 / -1;
  }
}
</style>
