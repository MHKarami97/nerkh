import { CATEGORY } from './categories.js'

/** One entry per JSON file produced by scripts/fetch-sanjagh.mjs (see GROUPS in scripts/lib/sanjagh/config.mjs). */
export const SERVICE_SOURCES = Object.freeze([
  { fileName: 'car-repair.json', category: CATEGORY.SERVICE_CAR_REPAIR, prefix: 'car-repair' },
  { fileName: 'building-services.json', category: CATEGORY.SERVICE_BUILDING, prefix: 'building' },
  { fileName: 'digital-repair.json', category: CATEGORY.SERVICE_DIGITAL, prefix: 'digital' },
  { fileName: 'home-services.json', category: CATEGORY.SERVICE_HOME, prefix: 'home' },
  { fileName: 'personal-care.json', category: CATEGORY.SERVICE_PERSONAL, prefix: 'personal' },
  { fileName: 'misc-services.json', category: CATEGORY.SERVICE_MISC, prefix: 'misc' },
])
