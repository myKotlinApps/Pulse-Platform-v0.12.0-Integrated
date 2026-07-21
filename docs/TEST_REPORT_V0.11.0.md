# گزارش تست ECU Pulse Platform v0.11.0

## تست‌های موفق

- Parse تمام JSONهای پروژه
- Parse تمام XMLهای Android و Manifest
- بررسی وجود تمام IDهای مورد استفاده در `web/ecu-console.js`
- بررسی وجود تمام ViewBinding IDهای صفحه Scanner Android
- `node --check` برای `web/app.js`، `web/ecu-console.js` و `server/server.js`
- اجرای HTTP محلی و دریافت موفق `index.html`، `ecu-console.js` و ۴۹ پروفایل
- تست مستقل Kotlin برای CommandGuard
- تست Kotlin روی MockTransport + Elm327Client:
  - ارسال `010C`
  - اجرای Init با `ATSP6`
  - شروع `ATMA`
  - دریافت فریم‌های Mock
  - توقف Monitor با Cancel/CR
- تست Smoke سرور Node.js
- تست `tools/check_parity.py` برای قابلیت‌های مشترک Web/Android
- کنترل باقی‌ماندن نقشه Web و `android_asset/trip-map.html`

## Build Android

ساخت کامل APK در محیط فعلی اجرا نشد، زیرا Gradle Wrapper برای اولین اجرا باید Gradle 9.5.0 را از `services.gradle.org` دریافت کند و DNS/اینترنت محیط Build در دسترس نبود. Syntax sourceها بررسی شد و خطای نحوی جدیدی یافت نشد. همچنین یک ایراد نحوی قدیمی در هر دو `PlatformPolicy.kt` مربوط به `List<String>=` اصلاح شد.

فرمان‌های Build پس از دسترسی Gradle/Android SDK:

```bash
cd android
./gradlew testLegacyGooglePlayDebugUnitTest
./gradlew assembleLegacyGooglePlayDebug
./gradlew assembleModernGooglePlayDebug
```
