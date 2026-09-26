import { getProducePrices } from './produceService.js'
import { getBeansPrices } from './foodBeansService.js'
import { getDriedFruitsPrices } from './foodDriedFruitsService.js'
import { getProteinCategory } from './foodProteinService.js'
import {
  normalizeProducePayload,
  normalizeBeansPayload,
  normalizeDriedFruitsPayload,
  normalizeProteinPayload,
} from './foodNormalizer.js'
import { CATEGORY } from './categories.js'

export const FOOD_REFRESH_INTERVAL_MS = 30 * 60 * 1000

const PROTEIN_SOURCES = [
  { fileName: 'protein-sheep.json', category: CATEGORY.FOOD_SHEEP, prefix: 'sheep' },
  { fileName: 'protein-veal.json', category: CATEGORY.FOOD_VEAL, prefix: 'veal' },
  { fileName: 'protein-chicken.json', category: CATEGORY.FOOD_CHICKEN, prefix: 'chicken' },
  { fileName: 'protein-aquatic.json', category: CATEGORY.FOOD_AQUATIC, prefix: 'aquatic' },
  { fileName: 'protein-poultry.json', category: CATEGORY.FOOD_POULTRY, prefix: 'poultry' },
]

export class FoodMarketService {
  constructor(store) {
    this.store = store
    this.intervalId = null
  }

  async init() {
    await this.refresh()
    this.intervalId = setInterval(() => this.refresh(), FOOD_REFRESH_INTERVAL_MS)
  }

  async refresh() {
    const tasks = [
      getProducePrices().then(normalizeProducePayload).catch(() => []),
      getBeansPrices().then(normalizeBeansPayload).catch(() => []),
      getDriedFruitsPrices().then(normalizeDriedFruitsPayload).catch(() => []),
      ...PROTEIN_SOURCES.map((source) =>
        getProteinCategory(source.fileName)
          .then((payload) => normalizeProteinPayload(payload, source.category, source.prefix))
          .catch(() => [])
      ),
    ]

    const results = await Promise.all(tasks)
    const assets = results.flat()
    if (assets.length) this.store.hydrateFood(assets)
  }

  dispose() {
    if (this.intervalId) clearInterval(this.intervalId)
  }
}
