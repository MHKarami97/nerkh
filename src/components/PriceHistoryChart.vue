<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  buildLinePath,
  downsample,
  movingAverage,
  nearestIndex,
  niceTicks,
  percentChange,
  timeTicks,
} from '../utils/chartMath.js';
import { useChartPreferences } from '../composables/useChartPreferences.js';

const props = defineProps({
  points: { type: Array, default: () => [] }, // [{ t: ms, v: number }] sorted by t
  stats: { type: Object, default: null }, // result of computeStats(points)
  color: { type: String, default: '#4a89ff' },
  unit: { type: String, default: '' },
});

const MOVING_AVERAGE_WINDOW = 7;
const PAD_TOP = 18;
const PAD_BOTTOM = 28;
const PAD_LEFT = 10;
const TOOLTIP_HALF_WIDTH = 88;
const DAY_MS = 86_400_000;
const CHART_TYPES = [
  { key: 'area', label: 'ناحیه‌ای' },
  { key: 'line', label: 'خطی' },
];

const dateFormat = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium' });
const dayFormat = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short', day: 'numeric' });
const monthFormat = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: '2-digit', month: 'short' });
const wholeFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });
const fractionFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });
const signedFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2, signDisplay: 'exceptZero' });

const preferences = useChartPreferences();
const gradientId = `ph-gradient-${Math.random().toString(36).slice(2, 8)}`;

const container = ref(null);
const width = ref(0);
const hoverIndex = ref(-1);
let observer = null;
let frameId = 0;

onMounted(() => {
  width.value = container.value.clientWidth;
  observer = new ResizeObserver(([entry]) => {
    width.value = entry.contentRect.width;
  });
  observer.observe(container.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  cancelAnimationFrame(frameId);
});

const isCompact = computed(() => width.value < 480);
const height = computed(() => (isCompact.value ? 230 : 300));
const maxPoints = computed(() => Math.max(40, Math.floor(width.value / 2)));
const canShowAverage = computed(() => props.points.length > MOVING_AVERAGE_WINDOW);
const showAverage = computed(() => preferences.movingAverage && canShowAverage.value);

const series = computed(() => downsample(props.points, maxPoints.value));
const averageSeries = computed(() =>
  showAverage.value ? downsample(movingAverage(props.points, MOVING_AVERAGE_WINDOW), maxPoints.value) : [],
);

const yAxis = computed(() => {
  if (!props.stats) return null;
  return niceTicks(props.stats.min.v, props.stats.max.v, isCompact.value ? 4 : 5);
});

const formatValue = (value) => (Math.abs(value) >= 100 ? wholeFormat : fractionFormat).format(value);
const formatAxis = (value) => (yAxis.value.step >= 1 ? wholeFormat : fractionFormat).format(value);

const paddingRight = computed(() => {
  if (!yAxis.value) return 0;
  const labels = [...yAxis.value.ticks.map(formatAxis), formatValue(props.stats.last.v)];
  return Math.max(...labels.map((label) => label.length)) * 6.4 + 14;
});

const layout = computed(() => {
  const axis = yAxis.value;
  const list = series.value;
  if (!axis || list.length < 2 || width.value === 0) return null;

  const left = PAD_LEFT;
  const right = width.value - paddingRight.value;
  const top = PAD_TOP;
  const bottom = height.value - PAD_BOTTOM;
  const startT = props.points[0].t;
  const spanT = props.points[props.points.length - 1].t - startT || 1;
  const spanV = axis.max - axis.min || 1;

  const toX = (t) => left + ((t - startT) / spanT) * (right - left);
  const toY = (v) => bottom - ((v - axis.min) / spanV) * (bottom - top);

  const coords = list.map((point) => ({ x: toX(point.t), y: toY(point.v) }));
  const line = buildLinePath(coords);
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${bottom} L${coords[0].x.toFixed(1)},${bottom} Z`;
  const average = averageSeries.value.length > 1
    ? buildLinePath(averageSeries.value.map((point) => ({ x: toX(point.t), y: toY(point.v) })))
    : '';

  const spanDays = spanT / DAY_MS;
  const labelFormat = spanDays <= 45 ? dayFormat : monthFormat;
  const xCount = isCompact.value ? 3 : 5;
  const seen = new Set();
  const xTicks = [];
  timeTicks(startT, startT + spanT, xCount).forEach((t, index, all) => {
    const label = labelFormat.format(t);
    if (seen.has(label)) return;
    seen.add(label);
    xTicks.push({ x: toX(t), label, anchor: index === 0 ? 'start' : index === all.length - 1 ? 'end' : 'middle' });
  });

  const yTicks = axis.ticks.map((value) => ({ y: toY(value), label: formatAxis(value) }));

  const { min, max, last } = props.stats;
  const extremes = [];
  if (min.v !== max.v) {
    extremes.push({ kind: 'max', x: toX(max.t), y: toY(max.v), label: formatValue(max.v), above: true });
    extremes.push({ kind: 'min', x: toX(min.t), y: toY(min.v), label: formatValue(min.v), above: toY(min.v) + 16 > bottom });
  }
  extremes.forEach((mark) => {
    mark.anchor = mark.x < 56 ? 'start' : mark.x > right - 56 ? 'end' : 'middle';
  });

  const lastY = toY(last.v);
  return { coords, line, area, average, left, right, top, bottom, xTicks, yTicks, extremes, lastY };
});

const hovered = computed(() => {
  if (hoverIndex.value < 0 || !layout.value) return null;
  const list = series.value;
  const index = Math.min(hoverIndex.value, list.length - 1);
  const point = list[index];
  const coord = layout.value.coords[index];
  const previous = index > 0 ? list[index - 1] : null;
  const vsFirst = percentChange(props.points[0].v, point.v);
  const vsPrevious = previous ? percentChange(previous.v, point.v) : null;
  return {
    x: coord.x,
    y: coord.y,
    left: Math.min(Math.max(coord.x, TOOLTIP_HALF_WIDTH), width.value - TOOLTIP_HALF_WIDTH),
    date: dateFormat.format(point.t),
    value: formatValue(point.v),
    vsFirst: signedFormat.format(vsFirst),
    vsFirstTone: vsFirst > 0 ? 'up' : vsFirst < 0 ? 'down' : 'flat',
    vsPrevious: vsPrevious === null ? null : signedFormat.format(vsPrevious),
    vsPreviousTone: vsPrevious > 0 ? 'up' : vsPrevious < 0 ? 'down' : 'flat',
  };
});

const lastLabel = computed(() => (props.stats ? formatValue(props.stats.last.v) : ''));
const lastBadgeWidth = computed(() => lastLabel.value.length * 6.4 + 10);

function updateHover(clientX) {
  if (!layout.value) return;
  const x = clientX - container.value.getBoundingClientRect().left;
  hoverIndex.value = nearestIndex(layout.value.coords, x);
}

function onPointerMove(event) {
  const { clientX } = event;
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(() => updateHover(clientX));
}

function onPointerLeave(event) {
  if (event.pointerType === 'mouse') hoverIndex.value = -1;
}

function clearHover() {
  hoverIndex.value = -1;
}

function onKeydown(event) {
  const last = series.value.length - 1;
  const current = hoverIndex.value;
  const handlers = {
    ArrowLeft: () => (current < 0 ? last : Math.max(0, current - 1)),
    ArrowRight: () => (current < 0 ? last : Math.min(last, current + 1)),
    Home: () => 0,
    End: () => last,
    Escape: () => -1,
  };
  const handler = handlers[event.key];
  if (!handler) return;
  event.preventDefault();
  hoverIndex.value = handler();
}
</script>

<template>
  <div class="ph-chart" :style="{ '--ph-color': color }">
    <div class="ph-chart__toolbar">
      <div class="ph-chart__group" role="group" aria-label="نوع نمودار">
        <button
          v-for="option in CHART_TYPES"
          :key="option.key"
          type="button"
          class="ph-chart__btn"
          :class="{ 'is-active': preferences.type === option.key }"
          :aria-pressed="preferences.type === option.key"
          @click="preferences.type = option.key"
        >
          {{ option.label }}
        </button>
      </div>
      <button
        type="button"
        class="ph-chart__btn"
        :class="{ 'is-active': showAverage }"
        :aria-pressed="showAverage"
        :disabled="!canShowAverage"
        :title="canShowAverage ? '' : 'برای میانگین متحرک حداقل ۸ نقطه لازم است'"
        @click="preferences.movingAverage = !preferences.movingAverage"
      >
        میانگین متحرک ۷ روزه
      </button>
    </div>

    <div
      ref="container"
      class="ph-chart__plot"
      :style="{ height: height + 'px' }"
      tabindex="0"
      role="group"
      aria-label="نمودار قیمت؛ با کلیدهای جهت‌دار نقاط را مرور کنید"
      @pointerdown="onPointerMove"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @pointercancel="clearHover"
      @blur="clearHover"
      @keydown="onKeydown"
    >
      <svg
        v-if="layout"
        class="ph-chart__svg"
        :width="width"
        :height="height"
        :viewBox="`0 0 ${width} ${height}`"
        aria-hidden="true"
      >
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="color" stop-opacity="0.32" />
            <stop offset="100%" :stop-color="color" stop-opacity="0" />
          </linearGradient>
        </defs>

        <g class="ph-chart__grid">
          <g v-for="tick in layout.yTicks" :key="tick.label + tick.y">
            <line :x1="layout.left" :x2="layout.right" :y1="tick.y" :y2="tick.y" />
            <text class="ph-chart__axis" :x="layout.right + 8" :y="tick.y + 3.5">{{ tick.label }}</text>
          </g>
          <text
            v-for="tick in layout.xTicks"
            :key="tick.label"
            class="ph-chart__axis"
            :x="tick.x"
            :y="height - 8"
            :text-anchor="tick.anchor"
          >{{ tick.label }}</text>
        </g>

        <g :key="preferences.type + series.length" class="ph-chart__series">
          <path v-if="preferences.type === 'area'" :d="layout.area" :fill="`url(#${gradientId})`" />
          <path
            :d="layout.line"
            fill="none"
            :stroke="color"
            stroke-width="2.4"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <path
            v-if="layout.average"
            :d="layout.average"
            class="ph-chart__average"
            fill="none"
            stroke-width="1.6"
            stroke-dasharray="5 4"
            stroke-linejoin="round"
          />
        </g>

        <g class="ph-chart__last">
          <line :x1="layout.left" :x2="layout.right" :y1="layout.lastY" :y2="layout.lastY" :stroke="color" />
          <rect
            :x="layout.right + 2"
            :y="layout.lastY - 9"
            :width="lastBadgeWidth"
            height="18"
            rx="5"
            :fill="color"
          />
          <text class="ph-chart__last-text" :x="layout.right + 2 + lastBadgeWidth / 2" :y="layout.lastY + 3.5" text-anchor="middle">
            {{ lastLabel }}
          </text>
        </g>

        <g v-for="mark in layout.extremes" :key="mark.kind" class="ph-chart__extreme">
          <circle :cx="mark.x" :cy="mark.y" r="3.5" :fill="mark.kind === 'max' ? 'var(--up)' : 'var(--down)'" />
          <text :x="mark.x" :y="mark.above ? mark.y - 8 : mark.y + 16" :text-anchor="mark.anchor">{{ mark.label }}</text>
        </g>

        <g v-if="hovered">
          <line class="ph-chart__guide" :x1="hovered.x" :x2="hovered.x" :y1="layout.top" :y2="layout.bottom" />
          <circle :cx="hovered.x" :cy="hovered.y" r="5.5" :fill="color" stroke="var(--card)" stroke-width="2.5" />
        </g>
      </svg>

      <div v-if="hovered" class="ph-chart__tooltip" :style="{ left: hovered.left + 'px' }">
        <span class="ph-chart__tooltip-date">{{ hovered.date }}</span>
        <strong><bdi>{{ hovered.value }}</bdi> {{ unit }}</strong>
        <span v-if="hovered.vsPrevious !== null" class="ph-chart__delta" :class="`is-${hovered.vsPreviousTone}`">
          نسبت به قبل <bdi dir="ltr">{{ hovered.vsPrevious }}٪</bdi>
        </span>
        <span class="ph-chart__delta" :class="`is-${hovered.vsFirstTone}`">
          نسبت به ابتدای بازه <bdi dir="ltr">{{ hovered.vsFirst }}٪</bdi>
        </span>
      </div>

      <p class="ph-chart__sr" aria-live="polite">
        <template v-if="hovered">{{ hovered.date }}: {{ hovered.value }} {{ unit }}</template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.ph-chart__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.ph-chart__group {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
}

.ph-chart__btn {
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.ph-chart__toolbar > .ph-chart__btn {
  border-color: var(--border);
  background: var(--bg-elevated);
}

.ph-chart__btn.is-active {
  background: var(--ph-color);
  color: #fff;
}

.ph-chart__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ph-chart__btn:focus-visible,
.ph-chart__plot:focus-visible {
  outline: 2px solid var(--ph-color);
  outline-offset: 2px;
}

.ph-chart__plot {
  position: relative;
  direction: ltr;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  border-radius: 12px;
  color: var(--text-muted);
}

.ph-chart__svg {
  display: block;
  overflow: visible;
}

.ph-chart__grid line {
  stroke: currentColor;
  stroke-opacity: 0.16;
  stroke-dasharray: 3 5;
}

.ph-chart__axis {
  font-size: 10px;
  fill: currentColor;
}

.ph-chart__last line {
  stroke-opacity: 0.55;
  stroke-dasharray: 2 4;
}

.ph-chart__last-text {
  font-size: 10px;
  font-weight: 700;
  fill: #fff;
}

.ph-chart__average {
  stroke: var(--fav-from, #f59e0b);
}

.ph-chart__extreme text {
  font-size: 10px;
  font-weight: 700;
  fill: var(--text);
  paint-order: stroke;
  stroke: var(--card);
  stroke-width: 3px;
  stroke-linejoin: round;
}

.ph-chart__guide {
  stroke: currentColor;
  stroke-opacity: 0.35;
  stroke-dasharray: 3 3;
}

.ph-chart__tooltip {
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.76rem;
  white-space: nowrap;
  pointer-events: none;
  direction: rtl;
  color: var(--text);
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.ph-chart__tooltip-date {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.ph-chart__tooltip strong {
  font-size: 0.9rem;
}

.ph-chart__delta {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.ph-chart__delta.is-up bdi { color: var(--up); }
.ph-chart__delta.is-down bdi { color: var(--down); }

.ph-chart__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .ph-chart__series {
    animation: ph-fade-in 0.35s ease;
  }
}

@keyframes ph-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
