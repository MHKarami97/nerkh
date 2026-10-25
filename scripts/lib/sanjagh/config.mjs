export const SOURCE_ORIGIN = 'https://sanjagh.pro'
export const SOURCE_NAME = 'sanjagh'
export const CURRENCY = 'تومان'

/** Politeness: one request at a time, at least MIN_GAP_MS (+ random jitter) between two requests. */
export const MIN_GAP_MS = 2500
export const JITTER_MS = 1500
export const MAX_ATTEMPTS = 2
export const MIN_RETENTION_RATIO = 0.5

/** HTTP statuses that mean "slow down": the whole run stops immediately and old data is kept. */
export const BLOCK_STATUSES = Object.freeze([403, 429])

/**
 * Each group = one UI category = one JSON file in public/data.
 * Each type = one sanjagh page (all of its tabs live inside that single page, so 1 request per type).
 * Order = display order; the first row of the first 4 types become the 4 pinned cards.
 */
export const GROUPS = Object.freeze([
  {
    id: 'car-repair',
    label: 'تعمیرات خودرو',
    fileName: 'car-repair.json',
    types: [
      { id: 'oil-change', label: 'تعویض روغن و فیلتر', slug: 'تعویض-روغن-و-فیلتر-ماشین' },
      { id: 'suspension', label: 'جلوبندی', slug: 'تعمیر-جلوبندی-خودرو' },
      { id: 'gearbox', label: 'گیربکس', slug: 'تعمیر-گیربکس' },
      { id: 'bumper', label: 'سپرسازی', slug: 'سپرسازی-و-تعمیر-سپر-خودرو' },
      { id: 'mirror', label: 'آینه', slug: 'تعویض-و-تعمیر-آینه-خودرو' },
      { id: 'mobile-mechanic', label: 'مکانیک سیار', slug: 'مکانیکی-سیار' },
      { id: 'wax-polish', label: 'واکس و پولیش', slug: 'واکس-و-پولیش-خودرو' },
      { id: 'inspection', label: 'کارشناسی خودرو', slug: 'کارشناس-خودرو' },
      { id: 'seat-cover', label: 'روکش صندلی', slug: 'نصب-روکش-صندلی-خودرو' },
    ],
  },
  {
    id: 'building',
    label: 'ساختمان و تأسیسات',
    fileName: 'building-services.json',
    types: [
      { id: 'building-painting', label: 'نقاشی ساختمان', slug: 'نقاشی-ساختمان' },
      { id: 'flooring', label: 'کفپوش', slug: 'نصب-کفپوش' },
      { id: 'kitchen-cabinet', label: 'کابینت آشپزخانه', slug: 'طراحی-و-ساخت-کابینت-آشپزخانه' },
      { id: 'carpentry', label: 'نجاری', slug: 'نجاری' },
      { id: 'double-glazed', label: 'شیشه دوجداره', slug: 'نصب-شیشه-دوجداره' },
      { id: 'steel-shutter', label: 'کرکره آهنی', slug: 'ساخت-کرکره-آهنی-مغازه' },
      { id: 'prefab', label: 'سوله و کانکس', slug: 'ساخت-نصب-و-تعمیر-سوله-و-کانکس' },
      { id: 'common-area-sensor', label: 'سنسور و تایمر مشاعات', slug: 'نصب-و-تعمیر-سنسور-و-تایمر-مشاعات' },
      { id: 'electric-fence', label: 'فنس الکتریکی', slug: 'طراحی-و-اجرای-فنس-الکتریکی' },
      { id: 'pool-painting', label: 'رنگ‌آمیزی استخر', slug: 'رنگ-آمیزی-استخر' },
      { id: 'pool-service', label: 'سرویس استخر', slug: 'سرویس-و-نگهداری-استخر' },
    ],
  },
  {
    id: 'digital',
    label: 'تعمیرات دیجیتال و لوازم برقی',
    fileName: 'digital-repair.json',
    types: [
      { id: 'laptop', label: 'تعمیر لپ‌تاپ', slug: 'تعمیر-لپ-تاپ' },
      { id: 'mobile-software', label: 'نرم‌افزار موبایل', slug: 'نصب-و-عیب-یابی-نرم-افزارهای-موبایلی' },
      { id: 'projector', label: 'ویدیو پروژکتور', slug: 'نصب-و-تعمیر-ویدیو-پروژکتور' },
      { id: 'blender', label: 'آسیاب و مخلوط‌کن', slug: 'تعمیر-آسیاب-و-مخلوط-کن' },
    ],
  },
  {
    id: 'home',
    label: 'خدمات منزل',
    fileName: 'home-services.json',
    types: [
      { id: 'moving', label: 'کارگر اسباب‌کشی', slug: 'کارگر-اسباب-کشی' },
      { id: 'dry-cleaning', label: 'خشکشویی لباس', slug: 'خشکشویی-لباس' },
      { id: 'sofa-cleaning', label: 'مبل‌شویی', slug: 'مبل-شویی' },
    ],
  },
  {
    id: 'personal',
    label: 'زیبایی و پوشاک',
    fileName: 'personal-care.json',
    types: [
      { id: 'hair-color', label: 'رنگ مو', slug: 'رنگ-موی-ساده-بانوان' },
      { id: 'nails', label: 'کاشت ناخن', slug: 'ترمیم-و-کاشت-ناخن-بانوان' },
      { id: 'facial', label: 'پاکسازی صورت', slug: 'پاکسازی-صورت-بانوان' },
      { id: 'suit', label: 'دوخت کت و شلوار', slug: 'دوخت-کت-و-شلوار' },
    ],
  },
  {
    id: 'misc',
    label: 'سایر خدمات',
    fileName: 'misc-services.json',
    types: [
      { id: 'legal', label: 'مشاوره حقوقی', slug: 'مشاوره-حقوقی' },
      { id: 'subtitle', label: 'زیرنویس فیلم', slug: 'زیرنویس-فیلم' },
      { id: 'child-photo', label: 'عکاسی کودک', slug: 'عکاسی-کودک' },
      { id: 'bicycle', label: 'تعمیر دوچرخه', slug: 'سرویس-و-تعمیر-دوچرخه' },
    ],
  },
])
