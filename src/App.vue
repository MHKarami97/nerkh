<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useMarketStore } from './stores/market.js'
import { MarketService } from './services/marketService.js'
import { FoodMarketService } from './services/foodMarketService.js'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import UpdateToast from './components/UpdateToast.vue'

const store = useMarketStore()
let marketService = null
let foodMarketService = null

onMounted(async () => {
  await store.loadFavoritesFromCache()

  marketService = new MarketService(store)
  await marketService.init()

  foodMarketService = new FoodMarketService(store)
  await foodMarketService.init()
})

onBeforeUnmount(() => {
  marketService?.dispose()
  foodMarketService?.dispose()
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
