# ECU Pulse Platform v0.13.0

مونوریپوی مشترک وب، Android/Kotlin، سرور تحلیل Node.js و پنل مدیریت.

## v0.13.0 — User logo pack integration

- پک `drawable-night-hdpi.zip` شامل ۹۳ PNG شفاف به پروژه اضافه شد.
- ۳۰ تطبیق مطمئن برند مستقیماً جایگزین SVG در Web و همه Variantهای Android شدند.
- Android ابتدا `*-pack-v130.png` را بارگذاری می‌کند و فقط در نبود آن سراغ PNG/SVG قبلی می‌رود.
- تمام ۹۳ فایل خام برای بررسی و نگاشت بعدی در `shared/logos/pack-v130-raw` نگهداری شده‌اند.
- Workflow ساخت APK با `android-actions/setup-android@v3` مقاوم‌تر شد.

## تجربه شروع
در اولین اجرای وب یا Android، «پروفایل نمایشی OBD-II» خودکار فعال می‌شود:
- اتصال داخلی Mock ELM327 بدون خودرو
- گیج‌های SVG استخراج‌شده از EPS برای Speed و RPM
- داده متحرک دمای آب، ولتاژ و بار موتور
- دو DTC نمونه P0133 و P0420
- پاک‌کردن آزمایشی بدون مصرف سهمیه واقعی
- یک مسیر نمونه برای آزمایش بازپخش وب

کاربر هر زمان می‌تواند خودرو واقعی را انتخاب و اتصال Bluetooth Classic یا Wi‑Fi TCP را برقرار کند.

## اجرا
### وب
```bash
cd web
python server.py
```

### سرور و پنل مدیریت
```bash
cd server
node server.js
```

- API: `http://127.0.0.1:4030`
- Admin: `http://127.0.0.1:4030/admin/`

### Android
پوشه `android/` را با Android Studio یا VS Code/Gradle باز کنید. نمونه Build:
```bash
./gradlew assembleLegacyGooglePlayDebug
./gradlew assembleModernGooglePlayDebug
```

## نکته
داده‌های Demo با نشان واضح نمایش داده می‌شوند و نباید با داده واقعی خودرو اشتباه گرفته شوند.


## Hotfix 0.8.1

- Fixed the web error dialog appearing immediately on startup.
- Fixed the Close button not hiding the dialog.
- Added Escape-key and backdrop-click closing.
- Added accessible dialog attributes and cache-busting for patched assets.


## 0.8.2 Development Pro access
کد آزمایشی 1234 برای فعال‌کردن منوی Pro در وب و Android Debug اضافه شد. این مسیر در Release Android غیرفعال است و نباید در انتشار نهایی استفاده شود.


## 0.8.3
- Added bundled Iranian manufacturer SVG logos and corrected brand resolution.
- Added a Tehran west-east-north-alley round-trip demo with map playback and stops.
- Added Android WebView route demo screen.


## 0.8.4
- Added bundled PNG versions for Iranian vehicle-brand logos.
- Web prefers local PNG logos for Iranian brands and falls back to SVG if needed.


## v0.8.5 — verified Iranian PNG logo fix

- Replaced the incorrect Iran Khodro animal badge with the correct horse shield PNG.
- Replaced Pars Khodro and Bahman placeholders.
- Added unique versioned PNG filenames so browser cache cannot reuse the old images.
- Normalized all 16 Iranian brand PNG assets for both Web and Android.
- Increased logo display size in the vehicle cards and active profile.
- Added an open-database source registry; no leaked or unlicensed proprietary database is bundled.


## v0.9.0 — Advanced Center and Trip Map functional release

- Fixed Leaflet CSS SRI and removed hard dependency on a single CDN.
- Added always-available offline SVG trip map.
- Added replay/pause/restart/seek/export/delete controls.
- Added simultaneous Node+Web development launcher.
- Made all Advanced Center options functional in Web and Android.
- Added Android trip foreground service and analysis/PDF screen.
- See `docs/MYDIAG_LIGHT_ANALYSIS.md`.


## v0.9.1 MyDiag-style theme
- Added a new responsive MyDiag-inspired home with 13 primary menus on Web and Android.
- Added MyDiag blue theme option for Web; new users default to it.
- Every primary menu opens an implemented page, an existing feature, or a clear feature dialog.
- No original MyDiag image assets or source code were copied; the visual language was independently recreated from the inspected layout structure.


## v0.10.0 — four EPS-driven themes

Six EPS uploads were analysed; three were exact duplicates, resulting in four unique visual systems. Four reusable themes were added to Web and Android:

- EPS Neon Analytics
- EPS Color Metrics
- EPS Mobile Gradient
- EPS Industrial Infographic

Each theme has a Web class, an Android theme class, live OBD bindings, reusable SVG elements, and the converted source sheet for future design work.


## v0.12.0 — Integrated ECU Console

- کنسول Read-only مستقیم ELM327/ECU داخل همان رابط اصلی Web و Android اضافه شد.
- ۴۹ پروفایل ELM327 از `shared/data/elm327-protocol-profiles.json` بین همه خروجی‌ها مشترک است.
- فرمان‌های پرکاربرد از یک کاتالوگ مشترک در Web و Android ساخته می‌شوند.
- Bus Monitor با ATMA و فیلتر ATCRA اضافه شد؛ هنگام مانیتورینگ Polling و کنسول قفل می‌شوند.
- ثبت خط‌به‌خط TX/RX/MON/SYS به JSONL و خروجی CSV در Web، و JSONL قابل Share در Android اضافه شد.
- منوهای نقشه، سفر، داشبورد، تحلیل، خودرو و تم‌های EPS بدون حذف یا جایگزینی حفظ شده‌اند.
- تمام Flavorهای Android (`legacy/modern × googlePlay/cafebazaar/myket`) از سورس مشترک این قابلیت استفاده می‌کنند.


## v0.12.0 — لوگو و بازپخش سفر

- جایگزینی ۱۶ لوگوی برند ایرانی با PNG شفاف و نسخه‌دار در منبع مشترک Web/Android.
- نشانگر PNG خودرو به‌جای دایره در نقشه آنلاین، نقشه آفلاین و Android WebView.
- حرکت نرم با `requestAnimationFrame` و درون‌یابی کوتاه‌ترین زاویه چرخش.
- حفظ نمای کل مسیر با `fitBounds` و حذف Pan فریم‌به‌فریم.
- دکمه «نمایش کل مسیر» و اصلاح نمایش «شروع دمو / اجرای دوباره دمو».

## GitHub Auto Build

روی ویندوز فایل `PUSH_BUILD_DOWNLOAD_APK.bat` را اجرا کنید. این فایل Repository را در اجرای اول می‌سازد، تغییرات را Commit و Push می‌کند، Workflow اندروید را اجرا می‌کند و APKهای ساخته‌شده را در `GitHub_APK_Artifacts` دانلود می‌کند. راهنمای فارسی کامل در `docs/GITHUB_AUTO_BUILD_FA.md` قرار دارد.

## آپدیت مستقیم ریپوی فعلی GitHub

برای فرستادن نسخه v0.13 روی همان ریپوی فعلی و ساخت APKها، فایل زیر را دوبارکلیک کنید:

```text
UPDATE_EXISTING_GITHUB_REPO_AND_BUILD.bat
```

این اسکریپت ریپوی `myKotlinApps/ECU-Pulse-Platform-v0.12.0-Full-Integrated` را در پوشه موقت Clone می‌کند، محتوای نسخه جدید را روی آن قرار می‌دهد، Push می‌کند، Workflow را دنبال می‌کند و Artifactهای APK را در `GitHub_APK_Artifacts` دانلود می‌کند.
