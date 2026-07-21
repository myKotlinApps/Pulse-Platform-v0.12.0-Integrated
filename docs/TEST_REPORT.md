# گزارش تست ECU Pulse v0.8

## پاس‌شده
- کنترل برابری قرارداد قابلیت‌ها: ۱۹ قابلیت
- نحو JavaScript وب با `node --check`
- نحو Node.js Server با `node --check`
- Smoke Test سرور تحلیل و پنل API
- Parse تمام فایل‌های JSON
- Parse هر ۱۵ فایل XML اندروید، شامل Portrait/Landscape/Tablet
- اعتبارسنجی `demo-profile.json`، دو DTC و ۷۲ نقطه مسیر نمونه
- کنترل وجود لوگوی Demo و SVGهای Speed/RPM در وب و Android
- همسان‌بودن فایل Demo در Shared، Web و Android
- کامپایل مستقل `MockTransport.kt` با Kotlin Compiler
- دریافت فایل Demo و Gauge از Python Web Server

## انجام‌نشده در این محیط
- Build کامل APK؛ Android SDK و Resolve کامل مخازن Google/Maven در این محیط آماده نبود.
- تست Bluetooth/Wi-Fi با دانگل واقعی ELM327 و خودرو واقعی.
- تست بصری خودکار Chromium به‌دلیل محدودیت GPU/DBus محیط Headless؛ صفحه و منابع با HTTP تست شدند.

## رفتار ایمنی Demo
- داده آزمایشی با Badge مشخص است.
- انتخاب خودروی واقعی اتصال Mock را قطع و Snapshot دمو را پاک می‌کند.
- پاک‌کردن خطا در نسخه وبِ Demo سهمیه واقعی را کم نمی‌کند.
