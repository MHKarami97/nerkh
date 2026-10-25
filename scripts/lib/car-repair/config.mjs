export const SOURCE_ORIGIN = 'https://sanjagh.pro'
export const SOURCE_NAME = 'sanjagh'
export const OUTPUT_FILE_NAME = 'car-repair.json'
export const CURRENCY = 'تومان'

/** Order here is the display order in the UI. Add a new tab = add one line. */
export const SERVICE_TYPES = Object.freeze([
  { id: 'oil-change', label: 'تعویض روغن و فیلتر', slug: 'تعویض-روغن-و-فیلتر-ماشین' },
  { id: 'suspension', label: 'جلوبندی', slug: 'تعمیر-جلوبندی-خودرو' },
  { id: 'gearbox', label: 'گیربکس', slug: 'تعمیر-گیربکس' },
  { id: 'bumper', label: 'سپرسازی', slug: 'سپرسازی-و-تعمیر-سپر-خودرو' },
  { id: 'mirror', label: 'آینه', slug: 'تعویض-و-تعمیر-آینه-خودرو' },
  { id: 'mobile-mechanic', label: 'مکانیک سیار', slug: 'مکانیکی-سیار' },
  { id: 'wax-polish', label: 'واکس و پولیش', slug: 'واکس-و-پولیش-خودرو' },
  { id: 'inspection', label: 'کارشناسی خودرو', slug: 'کارشناس-خودرو' },
])

export const MIN_RETENTION_RATIO = 0.5
export const REQUEST_GAP_MS = 1500
export const MAX_ATTEMPTS = 3
