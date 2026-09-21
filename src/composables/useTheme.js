/**
 * Composable: dark/light theme, persisted to localStorage and applied via
 * the `data-theme` attribute on <html> (see src/style.css for the actual
 * color tokens). Falls back to the OS preference on first visit.
 */
import { ref, watch } from 'vue'

const STORAGE_KEY = 'nerkh-theme'
const theme = ref(localStorage.getItem(STORAGE_KEY) || getSystemPreference())

function getSystemPreference() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
}

applyTheme(theme.value)

watch(theme, (value) => {
  applyTheme(value)
  localStorage.setItem(STORAGE_KEY, value)
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, toggleTheme }
}
