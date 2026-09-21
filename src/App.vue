<script setup>
/**
 * Root shell: wires the store, market service lifecycle, and lays out the
 * always-visible header/footer around whichever page the router is
 * showing. Route changes fade/slide instead of cutting instantly.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { useMarketStore } from './stores/market.js'
import { MarketService } from './services/marketService.js'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import UpdateToast from './components/UpdateToast.vue'

const store = useMarketStore()
let marketService = null

onMounted(async () => {
  await store.loadFavoritesFromCache()
  marketService = new MarketService(store)
  await marketService.init()
})

onBeforeUnmount(() => {
  marketService?.dispose()
})
</script>

<template>
  <AppHeader />
  <router-view v-slot="{ Component }">
    <transition name="page-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <AppFooter />
  <UpdateToast />
</template>
