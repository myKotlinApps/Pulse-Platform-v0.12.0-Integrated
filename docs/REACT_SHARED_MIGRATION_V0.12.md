# ECU Pulse v0.12 — React Shared Migration

این سند مرز مهاجرت نسخه `app.html` به کدبیس مشترک React را توضیح می‌دهد. هدف، حفظ کامل مدها، صفحات و رفتارهای فعلی و انتقال تدریجی به ساختاری است که برای وب، دسکتاپ، Android و iOS قابل استفاده باشد.

## تصمیم معماری

- فایل اصلی `app.html` به‌عنوان مرجع رفتاری و نسخه legacy حفظ می‌شود.
- مسیر `react-client/` به‌عنوان کدبیس React مشترک ادامه پیدا می‌کند.
- منطق اپ، داده‌ها، قالب‌بندی فارسی، انتخاب خودرو، دمو، مسیرها و OBD/ELM327 از UI جدا شده‌اند.
- برای خروجی موبایل، ساختار فعلی با Capacitor سازگار نگه داشته شده است؛ نصب پکیج‌های native به محیط build کاربر وابسته است.

## فایل‌های جدید مشترک

- `src/services/dataLoader.js` — بارگذاری `core-data.json`, `demo-profile.json`, `brand-logos.json`, `ecu-console-commands.json`
- `src/services/logoResolver.js` — تشخیص برند و resolve لوگو با همان قواعد `app.html`
- `src/services/demo.js` — شبیه‌سازی داده زنده و تبدیل demoTrip به فرمت مشترک
- `src/services/format.js` — اعداد فارسی، زمان، خلاصه سفر و محاسبات ساده
- `src/services/platform.js` — تشخیص Web/Desktop/Android/iOS/Capacitor و adapterهای ساده storage/file
- `src/services/obd.js` — CommandGuard، MockTransport، WebSerialTransport و interface مشترک ELM327

## صفحات مهاجرت‌شده در این مرحله

- `HomePage.jsx` اکنون از داده‌های واقعی، لوگوها و مسیرهای React Router استفاده می‌کند.
- `VehiclesPage.jsx` به کاتالوگ واقعی ۲۴۵ خودرو و لوگوهای `shared/logos` وصل شده است.
- `TripsPage.jsx` به demoTrip اصلی وصل شده و نقشه آفلاین SVG را بدون وابستگی Leaflet حفظ می‌کند.
- `ScannerPage.jsx` از adapter مشترک OBD/ELM327 و کاتالوگ دستورات اصلی استفاده می‌کند.
- `ParkingPage.jsx` از نقشه آفلاین و adapter geolocation استفاده می‌کند و دیگر به `react-leaflet` وابسته نیست.

## چرا فقط React وب کافی نیست؟

React وب به‌تنهایی برای Android و iOS خروجی native نمی‌دهد. برای یک کد مشترک، باید UI و منطق در React مشترک باشد و خروجی موبایل با Capacitor یا Expo/React Native ساخته شود. این ریپو فعلاً مسیر Capacitor را دارد؛ بنابراین اصلاحات این مرحله کد را به سمت web + mobile shell مشترک می‌برد.

## ELM327 و محدودیت پلتفرم

- Desktop Web: اتصال واقعی از مسیر Web Serial در Chrome/Edge امکان‌پذیر است.
- Android/iOS: اتصال Bluetooth Classic یا Wi-Fi نیازمند adapter native است.
- Web روی موبایل: Web Serial/Bluetooth Classic معمولاً در دسترس نیست؛ بنابراین باید از native shell استفاده شود.

## کارهای باقی‌مانده

- تکمیل visual parity همه صفحات React با `app.html`.
- افزودن adapter native برای Bluetooth Classic و Wi-Fi TCP در Android/iOS.
- بازگرداندن sync واقعی Capacitor بعد از نصب packageهای native در محیط build.
- تست UI روی desktop، web mobile viewport و Android/iOS shell.
