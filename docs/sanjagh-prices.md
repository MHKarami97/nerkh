# قیمت خدمات (منبع: سنجاق)

| گروه (`--group`) | فایل خروجی | دسته در UI |
|---|---|---|
| car-repair | car-repair.json | قیمت تعمیرات خودرو |
| building | building-services.json | ساختمان و تأسیسات |
| digital | digital-repair.json | تعمیرات دیجیتال و لوازم برقی |
| home | home-services.json | خدمات منزل |
| personal | personal-care.json | زیبایی و پوشاک |
| misc | misc-services.json | سایر خدمات |

- زمان‌بندی: هر گروه هفته‌ای یک بار، جمعه‌ها با فاصله یک ساعت (۰۶:۰۰ تا ۱۱:۰۰ تهران). فایل `.github/workflows/fetch-sanjagh.yml`
- اجرای دستی: Actions → Refresh Sanjagh Service Prices → Run workflow (`group=all` همه را پشت سر هم اجرا می‌کند)
- اجرای محلی: `npm i -D playwright && npx playwright install chromium && npm run fetch-sanjagh -- --group=building`
- تست: `npm run test:scripts`
- افزودن صفحه: یک خط در `types` همان گروه در `scripts/lib/sanjagh/config.mjs`
- افزودن گروه/دسته: یک آیتم در `GROUPS` + مقدار در `CATEGORY` و `SERVICE_CATEGORIES` (`categories.js`) + یک خط در `src/services/serviceSources.js`

## کاهش فشار روی سایت مبدأ
1. فقط یک درخواست در هر لحظه؛ حداقل ۲٫۵ ثانیه + تا ۱٫۵ ثانیه تصادفی بین دو درخواست (`RequestThrottle`)، حتی بین گروه‌ها.
2. هر صفحه فقط یک بار باز می‌شود؛ همه‌ی تب‌ها در همان صفحه‌اند.
3. تصویر، فونت، CSS، مدیا و هر درخواست غیر `sanjagh.pro` قبل از ارسال لغو می‌شود. اگر صفحه خالی رندر شد، `filterRequest` در `SanjaghPageScraper.mjs` را شل کنید.
4. با اولین پاسخ 403/429 کل اجرا متوقف می‌شود (بدون retry)؛ آنچه تا آن لحظه گرفته شده ذخیره و مابقی دست‌نخورده می‌ماند.
5. هر صفحه حداکثر ۲ تلاش دارد.

## قوانین حفظ داده
- صفحه‌ای که خطا بدهد، داده‌ی قبلی همان نوع را نگه می‌دارد (`status: "stale"`).
- اگر تعداد ردیف‌ها کمتر از ۵۰٪ ردیف‌های قبلی شود، خروجی مشکوک تلقی و رد می‌شود.
- ردیف‌های درصدی (مثل «کل کار ۱۰٪ تا ۳۵٪») تومان نیستند و نادیده گرفته می‌شوند.
- اگر هیچ قیمتی تغییر نکرده باشد فایل بازنویسی و commit نمی‌شود.
