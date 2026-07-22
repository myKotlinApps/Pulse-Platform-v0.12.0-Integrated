# ECU Pulse v0.12 — React Parity Migration

این سند مسیر صحیح فاز اول مهاجرت را ثبت می‌کند. طبق تصمیم کاربر، مهاجرت نباید هیچ کد، مد، صفحه، تابع، جریان، متن، UI یا رفتار موجود در `app.html` را کاهش، حذف، ساده‌سازی یا بازطراحی کند.

## قانون قطعی فاز اول

- `app.html` مرجع کامل و غیرقابل کاهش است.
- هر چیزی که در `app.html` وجود دارد باید در نسخه React parity وجود داشته باشد.
- React در فاز اول فقط host/wrapper است، نه بازنویسی سلیقه‌ای.
- کامپوننت‌سازی فقط بعد از تأیید parity انجام می‌شود و هر مرحله باید خروجی و رفتار یکسان داشته باشد.

## مسیر جدید

مسیر `react-parity/` برای فاز اول ساخته شده است. این مسیر با هدف parity کامل ایجاد شده و با `react-client/` ساده‌شده قبلی فرق دارد.

## ساختار react-parity

- `src/styles/legacy.css` — کل CSS استخراج‌شده از `app.html` بدون حذف.
- `src/legacy/body.html` — کل body markup استخراج‌شده از `app.html` بدون حذف.
- `src/legacy/runtime.js` — کل runtime JavaScript استخراج‌شده از `app.html` بدون حذف.
- `src/main.jsx` — React wrapper که body را render و runtime را inject می‌کند.
- `vite.config.js` — `shared/` را به‌عنوان public assets directory سرو می‌کند تا مسیرهای داده و لوگو حفظ شوند.
- `capacitor.config.js` — مسیر آماده برای Android/iOS shell.

## چرا این روش برای فاز اول درست است؟

چون تبدیل مستقیم همه چیز به کامپوننت در یک مرحله ریسک حذف یا تغییر رفتار دارد. روش parity-first باعث می‌شود ابتدا همان اپ فعلی داخل React بالا بیاید، بعد به‌صورت کنترل‌شده بخش‌ها از legacy به component تبدیل شوند.

## وضعیت فعلی

- CSS، body و runtime از `app.html` استخراج و منتقل شدند.
- همه مدها و تم‌ها حفظ شدند.
- صفحات MyDiag، Dashboard، Vehicles، Trips، Analysis، Pro Center، Store، Errors، Scanner، Settings، Driving Style، Parking، Dashcam حفظ شدند.
- WebSerialTransport، MockTransport، CommandGuard، SessionLogger، demo trip، map fallback، store/coupon, pro unlock, API analysis و تمام جریان‌های runtime حفظ شدند.

## اجرای محلی

```bash
cd react-parity
npm install
npm run dev
```

## مرحله بعد بعد از تأیید کاربر

بعد از اینکه نسخه parity تأیید شد، مهاجرت کامپوننتی به شکل incremental انجام می‌شود:

1. هر بار فقط یک بخش کوچک تبدیل شود.
2. قبل و بعد از تبدیل، همان UI و همان رفتار مقایسه شود.
3. هیچ تابع یا قابلیت بدون جایگزین ۱:۱ حذف نشود.
4. اگر adapter native برای Android/iOS اضافه شد، رفتار وب فعلی همچنان حفظ شود.
