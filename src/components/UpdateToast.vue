<script setup>
/**
 * PWA update notifier. Uses vite-plugin-pwa's Vue composable: when a new
 * service worker has installed and is waiting, `needRefresh` flips to
 * true and we show a compact snackbar asking the user to reload. No
 * install/"add to home screen" prompt is shown anywhere in this app —
 * only this update notice, per product requirement.
 */
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
})

function reload() {
  updateServiceWorker(true)
}

function dismiss() {
  needRefresh.value = false
}
</script>

<template>
  <Transition name="update-toast">
    <div v-if="needRefresh" class="update-toast" role="status" aria-live="polite">
      <svg class="update-toast__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 4v5h-5" />
      </svg>
      <span class="update-toast__text">نسخه جدید در دسترس است</span>
      <button type="button" class="update-toast__action" @click="reload">بروزرسانی</button>
      <button type="button" class="update-toast__close" aria-label="بستن" title="بستن" @click="dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.update-toast {
  position: fixed;
  inset-inline: 0;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(calc(100% - 24px), 380px);
  margin-inline: auto;
  padding: 6px 8px 6px 12px;
  background: var(--bg-elevated);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-hover);
}

.update-toast__icon {
  flex-shrink: 0;
  color: var(--accent);
}

.update-toast__text {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.4;
}

.update-toast__action {
  flex-shrink: 0;
  min-height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.update-toast__close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.update-toast__action:focus-visible,
.update-toast__close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.update-toast-enter-active,
.update-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.update-toast-enter-from,
.update-toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .update-toast-enter-active,
  .update-toast-leave-active {
    transition: none;
  }
}
</style>
