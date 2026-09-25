<script setup>
import { computed } from 'vue'
import { useMarketStore } from '../stores/market.js'
import { CATEGORY_LABELS } from '../services/categories.js'
import FavoritesBar from '../components/FavoritesBar.vue'
import CategoryBlock from '../components/CategoryBlock.vue'
import ProduceSection from '../components/ProduceSection.vue'
import ProteinCategorySection from '../components/ProteinCategorySection.vue'
import DriedFruitsSection from '../components/DriedFruitsSection.vue'
import BeansSection from '../components/BeansSection.vue'

const store = useMarketStore()
const categoriesWithData = computed(() =>
  store.categoryOrder.filter((category) => store.categoryHasAnyAsset(category))
)

// Each protein sub-category renders as its own section now (was one merged
// "مواد پروتئینی" list before). Adding a new stdt.ir protein category later
// only means adding one entry here — ProteinCategorySection.vue itself
// doesn't change.
const PROTEIN_CATEGORIES = [
  { title: 'گوسفند', fileName: 'protein-sheep.json' },
  { title: 'گوساله', fileName: 'protein-veal.json' },
  { title: 'مرغ', fileName: 'protein-chicken.json' },
  { title: 'ماهی و میگو', fileName: 'protein-aquatic.json' },
  { title: 'ماکیان', fileName: 'protein-poultry.json' },
]
</script>

<template>
  <main class="container" style="flex: 1; padding-bottom: 48px;">
    <FavoritesBar v-if="store.favoriteAssets.length" />
    <template v-for="category in categoriesWithData" :key="category">
      <h2 class="section-title">{{ CATEGORY_LABELS[category] }}</h2>
      <CategoryBlock :category="category" />
    </template>
    <ProduceSection />
    <ProteinCategorySection
      v-for="protein in PROTEIN_CATEGORIES"
      :key="protein.fileName"
      :title="protein.title"
      :file-name="protein.fileName"
    />
    <DriedFruitsSection />
    <BeansSection />
  </main>
</template>