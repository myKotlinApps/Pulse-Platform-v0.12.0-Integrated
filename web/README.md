# ECU Pulse — OBD Database Prototype

رابط خالص **HTML + CSS + JavaScript**؛ پایتون فقط فایل‌ها را به‌صورت محلی سرو می‌کند.

## اجرا

```powershell
python server.py
```

سپس مرورگر روی آدرس زیر باز می‌شود:

```text
http://127.0.0.1:8080/index.html
```

برای بازکردن روی گوشی متصل به همان شبکه:

```powershell
python server.py --host 0.0.0.0
```

## پوشش فعلی

- دیتابیس محلی PIDهای رایج Mode 01 و Mode 09
- همگام‌سازی و Cache دیتابیس عمومی OBDex شامل 9,533 DTC عمومی و PIDهای استاندارد
- جست‌وجوی P/B/C/U DTC
- کاتالوگ مسیریابی 245 خانواده/مدل رایج در ایران
- J1939 DM1 چهار بایتی و مجموعه عمومی PGNها
- هشدار و مسیر مستقل برای J1708/J1587 کامیون‌های قدیمی
- Import فایل JSON و CSV سفارشی به‌صورت Read-Only
- IndexedDB برای نگهداری دیتابیس کامل در مرورگر

## مرز پوشش

کدهای اختصاصی سازنده، PIDهای UDS، دیتابیس کامل SAE J1939 Digital Annex و فایل‌های DDT/دیاگ کارخانه‌ای در بسیاری موارد عمومی یا آزاد نیستند. برنامه آن‌ها را جعل نمی‌کند؛ ساختار Import برای فایل‌های معتبر و دارای مجوز در نظر گرفته شده است.

## حالت ایمنی

این نسخه فقط برای **خواندن و نمایش** طراحی شده است. فرمان‌های نوشتن، برنامه‌ریزی، کدینگ، ایموبلایزر، کیلومتر، پاک‌کردن حافظه و تست عملگر به افزونه‌ها راه داده نمی‌شوند.


## لوگو و انتخاب دستی خودرو
- صفحه خودروها انتخاب‌گر دستی برند → مدل دارد و پروفایل فعال در LocalStorage ذخیره می‌شود.
- لوگوهای پشتیبانی‌شده از Simple Icons/Wikimedia به‌صورت SVG بارگذاری می‌شوند.
- برای ذخیره محلی لوگوهای قابل‌دسترسی اجرا کنید: `python sync_logos.py`
- نشان‌های حروفی داخل `assets/logos` فقط fallback رابط هستند و لوگوی رسمی محسوب نمی‌شوند.


## 0.8.1
Fixed the persistent startup error modal caused by CSS overriding the `hidden` attribute.


## 0.8.2 Development Pro access
کد آزمایشی 1234 برای فعال‌کردن منوی Pro در وب و Android Debug اضافه شد. این مسیر در Release Android غیرفعال است و نباید در انتشار نهایی استفاده شود.


## 0.8.4
- Added bundled PNG versions for Iranian vehicle-brand logos.
- Web prefers local PNG logos for Iranian brands and falls back to SVG if needed.


## v0.10.0
Added four EPS-derived responsive themes and reusable live dashboard component classes.

## v0.12.0 — ECU Console integration

- منوی اصلی قبلی و نقشه سفر حفظ شده‌اند.
- «اسکنر و اتصال» به صفحه داخلی اتصال، کنسول ECU، Bus Monitor و فایل‌های لاگ متصل است.
- اتصال مستقیم Web Serial برای دانگل‌های COM در Chrome/Edge اضافه شده است.
- برای تست بدون خودرو، دکمه Mock ELM327 وجود دارد.
- ثبت مستقیم فایل به File System Access API نیاز دارد؛ دانلود JSONL/CSV در همه مرورگرهای مدرن در دسترس است.
