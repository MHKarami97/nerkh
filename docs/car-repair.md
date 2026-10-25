# قیمت تعمیرات خودرو

- منبع: صفحه‌های `https://sanjagh.pro/price/<slug>` (لیست در `scripts/lib/car-repair/config.mjs`)
- زمان‌بندی: هر جمعه ۰۶:۰۰ به وقت تهران (`.github/workflows/fetch-car-repair.yml`) + اجرای دستی با `workflow_dispatch`
- خروجی: `public/data/car-repair.json`
- افزودن تب جدید: یک خط به `SERVICE_TYPES` اضافه کنید.
- اجرای محلی: `npm i -D playwright && npx playwright install chromium && npm run fetch-car-repair`
- تست: `npm run test:scripts`

## قوانین حفظ داده
1. صفحه‌ای که خطا بدهد یا چیزی از آن پارس نشود، داده قبلیِ همان نوع دست‌نخورده می‌ماند (`status: "stale"`).
2. اگر تعداد ردیف‌های جدید کمتر از ۵۰٪ ردیف‌های قبلی باشد، خروجی مشکوک تلقی و داده قبلی نگه داشته می‌شود.
3. اگر هیچ قیمتی تغییر نکرده باشد فایل بازنویسی و commit نمی‌شود.
4. `changePercent` فقط وقتی قیمت عوض شود محاسبه می‌شود؛ `updatedAt` هر ردیف زمان آخرین تغییر قیمت است.

`public/data/car-repair.json` فعلی فقط شامل ۱۰ ردیف تب «آینه» است که دستی از صفحه مرجع برداشته شده؛ با اولین اجرای workflow کامل می‌شود.
