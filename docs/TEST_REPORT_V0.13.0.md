# گزارش آزمون ECU Pulse Platform v0.13.0

## محدوده تغییرات

- دریافت و تحلیل پک `drawable-night-hdpi.zip` با ۹۳ فایل PNG شفاف.
- تطبیق بصری مطمئن ۳۰ برند موجود در نرم‌افزار.
- تولید PNGهای یک‌دست 256×256 با نام `*-pack-v130.png`.
- همگام‌سازی کامل در Web، Android و Shared.
- حفظ SVGها و PNGهای قبلی به‌عنوان fallback.
- تغییر اولویت Android به `pack-v130 → official-v120 → verified-v110 → png → svg → fallback`.
- ارتقای نسخه Web و Android به 0.13.0.
- اصلاح Workflow با `android-actions/setup-android@v3` پیش از `sdkmanager`.

## برندهای فعال‌شده

Audi، BAIC، BMW، BYD، Chevrolet، Citroën، Dongfeng، FAW، Ford، Geely، Great Wall، Haval، Honda، Hyundai، Hyundai Commercial، Isuzu، Iveco، JAC، Kia، Lexus، Lifan، Mazda، Mercedes-Benz، Opel، Peugeot، Scania، Škoda، Subaru، Suzuki و Toyota.

## آزمون‌های اجراشده

- Parse و برابری سه نسخه `brand-logos.json`.
- کنترل نسخه Manifest برابر 1.4.
- وجود ۳۰ نگاشت فعال v130.
- وجود و برابری SHA-256 تصاویر در سه پلتفرم.
- کنترل ابعاد 256×256 و کانال Alpha.
- وجود ۹۳ فایل خام پک.
- کنترل تقدم `packV130` در Resolver اندروید.
- کنترل نسخه Android برابر 0.13.0 و Version Codeهای 101300/201300.
- کنترل نسخه Web و Cache Buster جدید.
- Parse تمام JSONها و XMLهای Android.
- `node --check` برای `web/app.js`، `web/ecu-console.js` و `server/server.js`.
- اجرای `tools/test_console_integration.py` و `tools/check_parity.py`.
- Parse فایل Workflow و کنترل وجود شش Variant.
- Smoke Test HTTP برای صفحه وب، Manifest لوگو و یک PNG نمونه.

## نتیجه

- تست اختصاصی لوگوها: **۰ خطا**.
- تست یکپارچگی Console: **موفق**.
- تست Parity: **۳۰ Feature بررسی‌شده و موفق**.
- Smoke Test وب: **موفق**.
- Workflow شامل هر شش خروجی Legacy/Modern برای Google Play، CafeBazaar و Myket است.

## محدودیت

APK در این محیط محلی Build نشده است. فایل `UPDATE_EXISTING_GITHUB_REPO_AND_BUILD.bat` نسخه جدید را روی ریپوی موجود Push می‌کند، GitHub Actions را دنبال می‌کند و APKها را دانلود می‌کند.
