# گزارش آزمون ECU Pulse Platform v0.12.0

## دامنه تغییرات

این نسخه مستقیماً روی مونوریپوی یکپارچه ECU Pulse اعمال شده است و Web، سورس مشترک Android و تمام Flavorهای فروشگاهی را پوشش می‌دهد.

- جایگزینی ۱۶ نشان ایرانی با PNG شفاف `official-v120` در `shared`، `web` و Android.
- اصلاح Resolver اندروید برای اولویت‌دادن به `official-v120` به‌جای `verified-v110`.
- جایگزینی نشانگر دایره‌ای سفر با PNG خودرو در Leaflet، نقشه SVG آفلاین Web و Android WebView.
- بازپخش نرم با `requestAnimationFrame`، درون‌یابی موقعیت و کوتاه‌ترین مسیر چرخش زاویه.
- حذف Pan فریم‌به‌فریم و Fit شدن کل مسیر با `fitBounds` در Web.
- ثابت‌ماندن کل مسیر در کادر Android با ViewBox دارای حاشیه.
- افزودن دکمه «نمایش کل مسیر / کل مسیر».
- اصلاح نمایش، اندازه و متن دکمه «شروع دمو / اجرای دوباره دمو».

## نتیجه آزمون خودکار

**۱۴۰ بررسی محتوایی و ساختاری: ۱۴۰ موفق، صفر ناموفق.**

### دارایی‌های لوگو

- وجود ۱۶ فایل PNG در هر سه مقصد `shared/web/android`: موفق.
- یکسان‌بودن SHA-256 هر فایل در هر سه مقصد: موفق.
- قالب PNG، حالت RGBA، اندازه 640×640 و وجود شفافیت: موفق.
- نسخه Manifest برابر `1.3`: موفق.
- یکسان‌بودن سه Manifest لوگو: موفق.
- معتبر بودن تمام مسیرهای `png` در Manifest: موفق.
- اولویت Resolver اندروید برای `official-v120`: موفق.

برندهای آزموده‌شده:

`IKCO, SAIPA, Zamyad, Bahman, KMC, MVM, Fownix, Farda, Lamari, Diar, Mammut, Pars Khodro, Bahman Diesel, IKCO Diesel, Modiran Khodro, Kerman Motor`

### نشانگر و بازپخش سفر

- وجود PNG شفاف 256×256 خودرو در هر سه مقصد: موفق.
- یکسان‌بودن فایل خودرو در Web، Android و Shared: موفق.
- نبود نشانگر Pulse/دایره‌ای قدیمی: موفق.
- استفاده Web و Android از PNG خودرو: موفق.
- `requestAnimationFrame` در هر دو پلتفرم: موفق.
- درون‌یابی کوتاه‌ترین زاویه، شامل آزمون 350→10 و 10→350 درجه: موفق.
- نبود `panTo` در حلقه بازپخش Web: موفق.
- `fitBounds` با حاشیه و `maxZoom: 13`: موفق.
- دکمه نمایش کل مسیر در Web و Android: موفق.

### رابط دمو و Android

- Parse شدن Layoutهای Portrait، Landscape و Tablet: موفق.
- حداقل ارتفاع 52dp، متن قابل‌خواندن و غیرفعال‌بودن All Caps: موفق.
- Visible بودن دائمی دکمه شروع دمو: موفق.
- تغییر متن به «اجرای دوباره دمو» پس از فعال‌شدن پروفایل: موفق.
- Parse شدن تمام ۲۶ فایل XML اندروید: موفق.
- Parse شدن تمام ۳۴ فایل JSON پروژه: موفق.
- اعلام هر شش Variant:
  - `legacyGooglePlay`
  - `legacyCafebazaar`
  - `legacyMyket`
  - `modernGooglePlay`
  - `modernCafebazaar`
  - `modernMyket`

تمام Variantها دارایی‌ها و منطق جدید را از `android/app/src/main` دریافت می‌کنند.

### JavaScript و Server

- `node --check web/app.js`: موفق.
- `node --check web/ecu-console.js`: موفق.
- `node --check web/themes/eps-themes.js`: موفق.
- Syntax اسکریپت درون‌خطی `trip-map.html`: موفق.
- `npm run check` برای Server: موفق.
- `npm test`: موفق؛ خروجی `server smoke ok`.

### HTTP Smoke Test

فایل‌های زیر از Web root با HTTP 200 بارگیری شدند:

- `index.html`
- `app.js`
- `assets/icons/trip-car-top.png`
- `data/brand-logos.json`
- `assets/logos/ikco-official-v120.png`

## محدودیت آزمون Build Android

APK در این محیط ساخته نشد. Gradle Wrapper برای نخستین Build باید Gradle 9.5.0 را دریافت کند، اما محیط اجرای فعلی DNS/Internet لازم برای `services.gradle.org` را در اختیار نداشت:

```text
Downloading Gradle 9.5.0 for the first build...
curl: (6) Could not resolve host: services.gradle.org
```

این محدودیت مربوط به محیط Build است، نه خطای Syntax یا ساختار پروژه. سورس مشترک، Manifestها، Layoutها، Assetها و تمام شش Variant به‌صورت ایستا بررسی شده‌اند.

## پیش‌نمایش‌ها

- `docs/LOGO_CONTACT_SHEET_V0.12.0.png`
- `docs/TRIP_CAR_ROTATION_PREVIEW_V0.12.0.jpg`
