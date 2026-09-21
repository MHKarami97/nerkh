<script setup>
/**
 * PWA update notifier. Uses vite-plugin-pwa's Vue composable: when a new
 * service worker has installed and is waiting, `needRefresh` flips to
 * true and we show a small snackbar asking the user to reload. No
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
  <div
    v-if="needRefresh"
    class="card"
    style="position:fixed; bottom:18px; left:50%; transform:translateX(-50%); z-index:60; padding:14px 18px; display:flex; align-items:center; gap:14px; max-width:92vw;"
  >
    <span style="font-size:0.9rem;">نسخه جدیدی از برنامه در دسترس است.</span>
    <button class="icon-btn" style="width:auto; padding:0 14px; background:var(--accent); color:#fff; border:none;" @click="reload">
      بروزرسانی
    </button>
    <button class="icon-btn" title="بستن" @click="dismiss">✕</button>
  </div>
</template>
