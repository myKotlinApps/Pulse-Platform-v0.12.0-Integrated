# معماری

- UI: Android Views + ViewBinding برای سازگاری API 21 و مصرف حافظه کمتر روی گوشی‌های قدیمی.
- State: ViewModel + StateFlow، جریان یک‌طرفه داده.
- I/O: Kotlin Coroutines روی Dispatchers.IO، یک Mutex برای صف فرمان ELM327.
- Transport: Bluetooth Classic RFCOMM/SPP و Wi-Fi TCP.
- Background: Foreground Service نوع connectedDevice فقط هنگام اتصال فعال؛ پیش‌فرض نگه‌داری اتصال در پس‌زمینه خاموش است.
- Polling: زمان‌بندی تطبیقی؛ RPM/Speed سریع، دما و ولتاژ کند، و توقف Polling زنده هنگام خروج UI مگر Logging فعال باشد.
- Storage: SharedPreferences برای تنظیمات کوچک و SQLiteOpenHelper برای تاریخچه دیاگ.
- Shared contract: `shared/features.json` و `shared/data` منبع اصلی وب و Android هستند.


## Demo Profile
`shared/demo-profile.json` منبع مشترک تجربه آغازین است. وب آن را مستقیماً بارگذاری می‌کند و Android از `MockTransport` با همان قرارداد استفاده می‌کند. گیج‌های Android از SVGهای استخراج‌شده از EPS به‌عنوان Face استفاده کرده و عقربه را Native رسم می‌کنند.

## Rotation / Window sizes
- `layout/`: گوشی Portrait؛ گیج‌های بزرگ عمودی.
- `layout-land/`: Landscape؛ دو گیج کنار هم.
- `layout-sw600dp/`: تبلت و نمایشگر بزرگ؛ لوگو و گیج‌های بزرگ‌تر.
Activity در Rotation بازسازی می‌شود ولی ViewModel و Session مشترک، وضعیت اتصال و داده را نگه می‌دارند.


## Trip presentation v0.12.0

- `shared/icons/trip-car-top.png` منبع مشترک نشانگر سفر است.
- Web از همان PNG در Leaflet و SVG آفلاین استفاده می‌کند.
- Android WebView از همان PNG در `trip-map.html` استفاده می‌کند.
- تمام دارایی‌های لوگو در `shared/logos/*-official-v120.png` نگهداری و با `tools/sync_shared.py` توزیع می‌شوند.


## Brand PNG pack v0.13.0

Brand metadata remains centralized in `shared/data/brand-logos.json`. Web reads the synchronized manifest and Android resolves `logos/<key>-pack-v130.png` before older PNG/SVG fallbacks. The raw 93-image pack is retained for audit and future mappings.
