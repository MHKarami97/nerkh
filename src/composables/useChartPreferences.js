/**
 * Composable: chart preferences (range, chart type, moving average) shared across
 * asset pages and persisted to localStorage.
 */
import { reactive, watch } from 'vue';
import { HISTORY_RANGES } from '../services/history.js';

const STORAGE_KEY = 'nerkh-chart-prefs';
const CHART_TYPES = ['area', 'line'];
const DEFAULTS = { range: 'month', type: 'area', movingAverage: false };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      range: HISTORY_RANGES.includes(saved.range) ? saved.range : DEFAULTS.range,
      type: CHART_TYPES.includes(saved.type) ? saved.type : DEFAULTS.type,
      movingAverage: saved.movingAverage === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

const preferences = reactive(load());

watch(preferences, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // storage may be unavailable (private mode / quota) - preferences just won't persist
  }
});

export function useChartPreferences() {
  return preferences;
}
