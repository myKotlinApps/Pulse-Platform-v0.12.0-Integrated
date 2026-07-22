# ECU Pulse React Parity v0.12

این مسیر فاز اول مهاجرت مو‌به‌مو است. هدف این پروژه کاهش یا بازطراحی نیست.

## قانون فاز اول

- `app.html` مرجع کامل است.
- تمام markup، CSS و runtime JS موجود در `app.html` بدون حذف به `react-parity` منتقل شده است.
- React در این فاز فقط نقش host/wrapper دارد.
- بعد از تأیید parity، کامپوننت‌سازی مرحله‌ای انجام می‌شود؛ هر کامپوننت باید خروجی و رفتار یکسان داشته باشد.

## ساختار

- `src/legacy/body.html` — body کامل استخراج‌شده از app.html
- `src/styles/legacy.css` — style کامل استخراج‌شده از app.html
- `src/legacy/runtime.js` — script کامل استخراج‌شده از app.html
- `src/main.jsx` — React wrapper که legacy body را render و runtime را inject می‌کند

## اجرا

```bash
cd react-parity
npm install
npm run dev
```

## نکته پلتفرمی

برای Android/iOS می‌توان بعد از build وب از Capacitor استفاده کرد. در فازهای بعدی adapterهای native برای Bluetooth/Wi-Fi/ELM327 اضافه می‌شوند، اما تا پایان parity هیچ رفتاری حذف یا جایگزین نمی‌شود.
