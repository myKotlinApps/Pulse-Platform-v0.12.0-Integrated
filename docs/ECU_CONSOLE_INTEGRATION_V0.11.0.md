# ادغام ECU Console در ECU Pulse Platform v0.11.0

این نسخه مستقیماً از پروژه `ECU_Pulse_Platform_v0.10.0_Full(1).zip` ساخته شده است؛ رابط قبلی، نقشه سفر، داشبورد، خودروها، تحلیل، فروشگاه و تم‌های EPS حذف یا جایگزین نشده‌اند.

## Web

کارت «اسکنر و اتصال» در خانه MyDiag به صفحه داخلی جدیدی متصل شده است که پنج بخش عملیاتی دارد:

1. اتصال مستقیم ELM327 با Web Serial و Mock Transport
2. کنسول خواندنی ECU با ورودی مشابه CLI
3. فرمان‌های آماده OBD-II و AT از کاتالوگ مشترک
4. Bus Monitor با `ATMA`، فیلتر `ATCRA` و ثبت `TX/RX/MON/SYS`
5. خروجی JSONL و CSV و ثبت مستقیم روی فایل در مرورگرهای پشتیبان File System Access API

فایل اصلی قابلیت جدید: `web/ecu-console.js`

## Android

صفحه جدید Scanner Hub در سورس مشترک `src/main` قرار دارد. در نتیجه این شش خانواده Build همان کد را دریافت می‌کنند:

- Legacy Google Play
- Legacy CafeBazaar
- Legacy Myket
- Modern Google Play
- Modern CafeBazaar
- Modern Myket

قابلیت‌ها:

- استفاده از اتصال Bluetooth Classic، Wi-Fi TCP یا Mock موجود در برنامه
- Secure RFCOMM و Insecure RFCOMM fallback با Timeout
- انتخاب و اجرای ۴۹ پروفایل ELM327
- صف مشترک فرمان با Mutex
- توقف Polling هنگام فرمان دستی و Bus Monitor
- توقف ATMA با ارسال CR
- ثبت خط‌به‌خط JSONL در `Documents/ecu-pulse-logs`
- اشتراک‌گذاری فایل با FileProvider

## ایمنی

حالت کنسول به‌طور پیش‌فرض Read-only است. Mode 04، Mode 08 و سرویس‌های Reset، Security Access، Write Data، Routine Control، Download/Upload و Programming مسدود هستند. سرویس‌های خواندنی `19/1A/21/22` فقط با فعال‌سازی گزینه «خواندن پیشرفته» اجازه اجرا دارند.

## داده مشترک

- `shared/data/elm327-protocol-profiles.json`
- `shared/data/ecu-console-commands.json`

اسکریپت `tools/sync_shared.py` این فایل‌ها را به Web و Android منتقل می‌کند.
