# وضعیت پیاده‌سازی v0.8

## افزوده‌شده در v0.8
- پروفایل OBD دمو به‌عنوان تجربه اجرای اول در وب و Android
- Auto-connect به Mock ELM327 در اولین اجرای Android
- گیج‌های واقعی SVG استخراج‌شده از EPS در Android و وب
- DTC و Mode 04 آزمایشی بدون مصرف سهمیه واقعی
- مسیر نمونه برای بازپخش وب


## فعال
- Bluetooth Classic RFCOMM/SPP برای ELM327های Pairشده
- Wi-Fi TCP با IP و Port قابل تنظیم
- شبیه‌ساز داخلی برای تست بدون خودرو
- راه‌اندازی ELM327 و ATSP0
- خواندن ATI، ATDP، ATDPN، ATRV
- خواندن PIDهای RPM، Speed، Coolant، Load و Voltage
- Auto Detect عمومی: Protocol، VIN، Calibration ID، ECU Name و Supported PID bitmap
- انتخاب دستی برند و مدل از کاتالوگ 245 خودرو
- لوگوی SVG برندها در وب و Android
- DTC Stored/Pending/Permanent با Mode 03/07/0A
- پاک‌کردن ایمن خطای عمومی با Mode 04
- ثبت تاریخچه Read/Clear در SQLite
- توقف Polling زنده در پس‌زمینه به‌صورت پیش‌فرض
- Foreground Service نوع connectedDevice
- دو خروجی legacy و modern

## نیازمند تست سخت‌افزاری
- تفاوت Firmware کلون‌های ELM327
- آداپتورهای Wi-Fi با Prompt یا Baud/Port متفاوت
- خودروهای ISO 9141/KWP قدیمی
- پاسخ‌های چند ECU و CAN 29-bit
- برند/مدل دقیق بر اساس VIN؛ فعلاً مدل در صورت عدم تطبیق دستی انتخاب می‌شود

## عمداً غیرفعال
- پاک‌کردن خطای ماژول‌های اختصاصی
- J1939 DM3/DM11
- UDS ClearDiagnosticInformation 0x14
- Coding/Programming/Actuator/Immobilizer/EEPROM/Flash
