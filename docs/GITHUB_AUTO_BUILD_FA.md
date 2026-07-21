# ارسال خودکار به GitHub و ساخت APK

فایل `PUSH_BUILD_DOWNLOAD_APK.bat` را از ریشه پروژه اجرا کنید.

## اجرای اول

1. اگر Git یا GitHub CLI نصب نباشد، اسکریپت تلاش می‌کند آن‌ها را با `winget` نصب کند.
2. مرورگر برای ورود امن به GitHub باز می‌شود؛ رمز یا Token داخل فایل ذخیره نمی‌شود.
3. نام Repository و حالت `private` یا `public` پرسیده می‌شود.
4. کل پروژه Commit و Push می‌شود.
5. Workflow اندروید روی GitHub Actions اجرا می‌شود.
6. شش APK آزمایشی دانلود و در پوشه `GitHub_APK_Artifacts` ذخیره می‌شوند.

## اجراهای بعدی

فقط فایل BAT را دوبار کلیک کنید. Remote و ورود GitHub از قبل ذخیره شده‌اند؛ اسکریپت تغییرات را Commit، Push و Build می‌کند. اگر تغییری وجود نداشته باشد، Workflow را دستی اجرا می‌کند تا APK جدید ساخته شود.

## خروجی‌ها

- Legacy Google Play
- Legacy CafeBazaar
- Legacy Myket
- Modern Google Play
- Modern CafeBazaar
- Modern Myket

این APKها Debug هستند و برای نصب و تست مناسب‌اند. انتشار در فروشگاه به امضای Release و Keystore خصوصی نیاز دارد.
