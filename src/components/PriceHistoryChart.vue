<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  points: { type: Array, default: () => [] },
  color: { type: String, default: '#4a89ff' },
  unit: { type: String, default: '' },
});

const HEIGHT = 220;
const PADDING = 14;
const TOOLTIP_HALF_WIDTH = 64;

const dateFormat = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium' });
const numberFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });

const container = ref(null);
const width = ref(0);
const hoverIndex = ref(-1);
let observer = null;

onMounted(() => {
  width.value = container.value.clientWidth;
  observer = new ResizeObserver(([entry]) => {
    width.value = entry.contentRect.width;
  });
  observer.observe(container.value);
});

onBeforeUnmount(() => observer?.disconnect());

const stats = computed(() => {
  const list = props.points;
  if (list.length === 0) return null;

  let min = list[0].v;
  let max = list[0].v;
  for (const point of list) {
    if (point.v < min) min = point.v;
    if (point.v > max) max = point.v;
  }

  const first = list[0].v;
  const last = list[list.length - 1].v;
  return { min, max, changePercent: first ? ((last - first) / first) * 100 : 0 };
});

const layout = computed(() => {
  const list = props.points;
  if (list.length < 2 || width.value === 0 || !stats.value) return null;

  const { min, max } = stats.value;
  const minT = list[0].t;
  const spanT = list[list.length - 1].t - minT || 1;
  const spanV = max - min;
  const innerW = width.value - PADDING * 2;
  const innerH = HEIGHT - PADDING * 2;

  const coords = list.map((point) => ({
    x: PADDING + ((point.t - minT) / spanT) * innerW,
    y: spanV === 0 ? HEIGHT / 2 : HEIGHT - PADDING - ((point.v - min) / spanV) * innerH,
  }));

  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ');
  const baseline = HEIGHT - PADDING;
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${baseline} L${coords[0].x.toFixed(1)},${baseline} Z`;

  return { coords, line, area };
});

function nearestIndex(coords, x) {
  let low = 0;
  let high = coords.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (coords[mid].x < x) low = mid;
    else high = mid;
  }
  return Math.abs(coords[low].x - x) <= Math.abs(coords[high].x - x) ? low : high;
}

function onPointerMove(event) {
  if (!layout.value) return;
  const x = event.clientX - container.value.getBoundingClientRect().left;
  hoverIndex.value = nearestIndex(layout.value.coords, x);
}

function onPointerLeave() {
  hoverIndex.value = -1;
}

const hovered = computed(() => {
  if (hoverIndex.value < 0 || !layout.value) return null;
  const point = props.points[hoverIndex.value];
  const coord = layout.value.coords[hoverIndex.value];
  return {
    x: coord.x,
    y: coord.y,
    left: Math.min(Math.max(coord.x, TOOLTIP_HALF_WIDTH), width.value - TOOLTIP_HALF_WIDTH),
    date: dateFormat.format(point.t),
    value: numberFormat.format(point.v),
  };
});

const formatValue = (value) => numberFormat.format(value);
</script>

<template>
  <div class="price-chart">
    <div
      ref="container"
      class="price-chart__plot"
      :style="{ height: HEIGHT + 'px' }"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
    >
      <svg
        v-if="layout"
        :width="width"
        :height="HEIGHT"
        :viewBox="`0 0 ${width} ${HEIGHT}`"
        role="img"
        aria-label="price history chart"
      >
        <path :d="layout.area" :fill="color" fill-opacity="0.12" />
        <path
          :d="layout.line"
          fill="none"
          :stroke="color"
          stroke-width="2.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <g v-if="hovered">
          <line :x1="hovered.x" :x2="hovered.x" y1="0" :y2="HEIGHT" stroke="currentColor" stroke-opacity="0.2" />
          <circle :cx="hovered.x" :cy="hovered.y" r="5" :fill="color" stroke="var(--card-bg, #fff)" stroke-width="2" />
        </g>
      </svg>

      <div v-if="hovered" class="price-chart__tooltip" :style="{ left: hovered.left + 'px' }">
        <span>{{ hovered.date }}</span>
        <strong><bdi>{{ hovered.value }}</bdi> {{ unit }}</strong>
      </div>
    </div>

    <dl v-if="stats && layout" class="price-chart__stats">
      <div>
        <dt>کمترین</dt>
        <dd><bdi>{{ formatValue(stats.min) }}</bdi></dd>
      </div>
      <div>
        <dt>بیشترین</dt>
        <dd><bdi>{{ formatValue(stats.max) }}</bdi></dd>
      </div>
      <div>
        <dt>تغییر بازه</dt>
        <dd dir="ltr">{{ stats.changePercent >= 0 ? '+' : '' }}{{ stats.changePercent.toFixed(2) }}%</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.price-chart__plot {
  position: relative;
  direction: ltr;
  touch-action: pan-y;
}

.price-chart__plot svg {
  display: block;
}

.price-chart__tooltip {
  position: absolute;
  top: 6px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 0.78rem;
  white-space: nowrap;
  pointer-events: none;
  background: var(--card-bg, #fff);
  border: 1px solid var(--border, rgba(128, 128, 128, 0.3));
}

.price-chart__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 14px 0 0;
  text-align: center;
}

.price-chart__stats dt {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.price-chart__stats dd {
  margin: 2px 0 0;
  font-weight: 700;
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .price-chart__stats dd {
    font-size: 0.8rem;
  }
}
</style>