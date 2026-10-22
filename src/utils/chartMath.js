/** Pure, framework-free chart helpers. Every function is side-effect free and unit-testable. */

export function percentChange(from, to) {
  return from ? ((to - from) / from) * 100 : 0;
}

function computeVolatility(points) {
  let count = 0;
  let mean = 0;
  let m2 = 0;
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1].v;
    if (!previous) continue;
    const ret = percentChange(previous, points[i].v);
    count++;
    const delta = ret - mean;
    mean += delta / count;
    m2 += delta * (ret - mean);
  }
  return count > 1 ? Math.sqrt(m2 / (count - 1)) : 0;
}

/** Single pass over points: min/max (with their points), average, change and volatility (Welford). */
export function computeStats(points) {
  if (!points.length) return null;

  let min = points[0];
  let max = points[0];
  let sum = 0;
  for (const point of points) {
    if (point.v < min.v) min = point;
    if (point.v > max.v) max = point;
    sum += point.v;
  }

  const first = points[0];
  const last = points[points.length - 1];
  return {
    count: points.length,
    first,
    last,
    min,
    max,
    average: sum / points.length,
    change: last.v - first.v,
    changePercent: percentChange(first.v, last.v),
    volatility: computeVolatility(points),
    position: max.v === min.v ? 0.5 : (last.v - min.v) / (max.v - min.v),
  };
}

/** Largest-Triangle-Three-Buckets: keeps the visual shape while capping the number of drawn points. */
export function downsample(points, threshold) {
  const total = points.length;
  if (threshold >= total || threshold < 3) return points;

  const bucketSize = (total - 2) / (threshold - 2);
  const sampled = [points[0]];
  let anchor = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const nextStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, total);
    let avgT = 0;
    let avgV = 0;
    for (let j = nextStart; j < nextEnd; j++) {
      avgT += points[j].t;
      avgV += points[j].v;
    }
    avgT /= nextEnd - nextStart;
    avgV /= nextEnd - nextStart;

    const start = Math.floor(i * bucketSize) + 1;
    const end = Math.floor((i + 1) * bucketSize) + 1;
    const a = points[anchor];
    let bestArea = -1;
    let bestIndex = start;
    for (let j = start; j < end; j++) {
      const area = Math.abs((a.t - avgT) * (points[j].v - a.v) - (a.t - points[j].t) * (avgV - a.v));
      if (area > bestArea) {
        bestArea = area;
        bestIndex = j;
      }
    }
    sampled.push(points[bestIndex]);
    anchor = bestIndex;
  }

  sampled.push(points[total - 1]);
  return sampled;
}

/** Simple moving average using a running sum (O(n)). */
export function movingAverage(points, windowSize) {
  if (points.length < windowSize) return [];
  const result = [];
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += points[i].v;
    if (i >= windowSize) sum -= points[i - windowSize].v;
    if (i >= windowSize - 1) result.push({ t: points[i].t, v: sum / windowSize });
  }
  return result;
}

function niceNumber(range, round) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let nice;
  if (round) nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  else nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * 10 ** exponent;
}

/** "Nice" axis ticks (1/2/5 x 10^n) that fully enclose [min, max]. */
export function niceTicks(min, max, desiredCount = 5) {
  let low = min;
  let high = max;
  if (low === high) {
    const pad = Math.abs(low) * 0.01 || 1;
    low -= pad;
    high += pad;
  }
  const step = niceNumber(niceNumber(high - low, false) / (desiredCount - 1), true);
  const axisMin = Math.floor(low / step) * step;
  const axisMax = Math.ceil(high / step) * step;
  const count = Math.round((axisMax - axisMin) / step);
  const ticks = [];
  for (let i = 0; i <= count; i++) ticks.push(axisMin + i * step);
  return { ticks, min: axisMin, max: axisMax, step };
}

export function timeTicks(startT, endT, count) {
  const ticks = [];
  for (let i = 0; i < count; i++) ticks.push(startT + ((endT - startT) * i) / (count - 1));
  return ticks;
}

export function buildLinePath(coords) {
  const parts = new Array(coords.length);
  for (let i = 0; i < coords.length; i++) {
    parts[i] = `${i === 0 ? 'M' : 'L'}${coords[i].x.toFixed(1)},${coords[i].y.toFixed(1)}`;
  }
  return parts.join(' ');
}

/** Binary search for the coordinate whose x is closest to the given x. */
export function nearestIndex(coords, x) {
  let low = 0;
  let high = coords.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (coords[mid].x < x) low = mid;
    else high = mid;
  }
  return Math.abs(coords[low].x - x) <= Math.abs(coords[high].x - x) ? low : high;
}
