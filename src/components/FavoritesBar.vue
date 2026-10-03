<script setup>
import { computed } from 'vue';
import { useMarketStore } from '../stores/market.js';
import CategorySection from './CategorySection.vue';

const store = useMarketStore();
const count = computed(() => store.favoriteAssets.length);
</script>

<template>
  <section class="favorites-section" aria-labelledby="favorites-title">
    <header class="favorites-section__header">
      <svg class="favorites-section__icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="m12 20-1.45-1.32C5.4 14 2 10.9 2 7.25A5.25 5.25 0 0 1 7.25 2 5.8 5.8 0 0 1 12 4.65 5.8 5.8 0 0 1 16.75 2 5.25 5.25 0 0 1 22 7.25c0 3.65-3.4 6.75-8.55 11.43L12 20Z"
        />
      </svg>
      <h2 id="favorites-title" class="favorites-section__title">علاقه‌مندی‌ها</h2>
      <span class="favorites-section__count">{{ count.toLocaleString('fa-IR') }}</span>
    </header>

    <div class="grid">
      <CategorySection :assets="store.favoriteAssets" flat />
    </div>
  </section>
</template>