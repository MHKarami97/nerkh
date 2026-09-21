<script setup>
/**
 * Root shell: wires the store, market service lifecycle, and lays out the
 * always-visible header/footer around whichever page the router is
 * showing (home grid or an asset's detail/chart page).
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
  <RouterView />
  <AppFooter />
  <UpdateToast />
</template>
