
const brandRules = [
  ['parskhodro', /پارس.?خودرو/], ['ikcodiesel', /ایران.?خودرو دیزل/], ['bahmandiesel', /بهمن دیزل/],
  ['fownix', /فونیکس|FOWNIX|تیگو 7|تیگو 8|FX/], ['mvm', /MVM|X22|X33|X55|آریزو/], ['modirankhodro', /مدیران خودرو/],
  ['kmc', /KMC/], ['jac', /جک|JAC/], ['kermanmotor', /کرمان موتور/], ['lamari', /آرین پارس|لاماری/],
  ['farda', /فردا موتور|FMC|SUBA/], ['diar', /دیار خودرو/], ['mammut', /ماموت خودرو/], ['zamyad', /زامیاد|پادرا|کارون/],
  ['bahman', /بهمن موتور|فیدلیتی|دیگنیتی|ریسپکت|کاپرا/], ['ikco', /ایران.?خودرو|رانا|سمند|سورن|دنا|تارا|ری.?را/],
  ['saipa', /سایپا|پراید|تیبا|ساینا|کوییک|اطلس|شاهین/], ['lexus', /لکسوس|Lexus|RX|NX/], ['audi', /آئودی|Audi|A3|A4|Q5/],
  ['skoda', /اشکودا|اوکتاویا/], ['volkswagen', /فولکس|Volkswagen|گلف|پاسات|تیگوان/], ['citroen', /سیتروئن|C3|C5/],
  ['peugeot', /پژو|Peugeot|۲۰۶|۲۰۷|۳۰۱|۲۰۰۸/], ['renault', /رنو|Renault|تندر|ساندرو|لوگان|داستر|کپچر|مگان/],
  ['mercedesbenz', /مرسدس|بنز|Actros|Axor|Atego/], ['bmw', /BMW|ب.?ام.?و/], ['mini', /MINI/],
  ['toyota', /تویوتا|Toyota|کرولا|کمری|پریوس|RAV4|لندکروزر|هایلوکس/], ['hyundaicommercial', /هیوندای تجاری|HD65|HD78|Xcient/],
  ['hyundai', /هیوندای|Hyundai|اکسنت|النترا|سوناتا|آزرا|توسان|سانتافه/], ['kia', /کیا|Kia|ریو|سراتو|اپتیما|اسپورتیج|سورنتو/],
  ['nissan', /نیسان|Nissan|ماکسیما|مورانو|قشقایی|جوک|تیانا/], ['mitsubishi', /میتسوبیشی|Mitsubishi|لنسر|اوتلندر|پاجرو/],
  ['mazda', /مزدا|Mazda/], ['suzuki', /سوزوکی|Suzuki|ویتارا/], ['honda', /هوندا|Honda|سیویک|آکورد/], ['opel', /اوپل|Opel|آسترا|کورسا/],
  ['ford', /فورد|Ford/], ['chevrolet', /شورولت|Chevrolet/], ['subaru', /سابارو|Subaru/], ['mg', /(^|\s)MG/], ['geely', /جیلی|Geely/],
  ['changan', /چانگان|Changan/], ['byd', /BYD/], ['haval', /هاوال|Haval/], ['greatwall', /گریت.?وال|وینگل|Great Wall/],
  ['dongfeng', /دانگ.?فنگ|Dongfeng/], ['faw', /فاو|FAW|بسترن|Bestune/], ['brilliance', /برلیانس|Brilliance/], ['baic', /BAIC/],
  ['scania', /اسکانیا|Scania/], ['volvotrucks', /ولوو تراکس|FH|FMX/], ['volvo', /ولوو|Volvo/], ['isuzu', /ایسوزو|Isuzu/],
  ['iveco', /ایویکو|Iveco/], ['daf', /داف|DAF/], ['man', /(^|\s)مان(\s|$)|MAN|TGX|TGS/], ['foton', /فوتون|آومان|Foton|Auman/],
  ['shacman', /شاکمن|Shacman/], ['kamaz', /کاماز|Kamaz/], ['dayun', /دایون|Dayun/], ['generic', /.*/],
];

export function brandKey(vehicle) {
  const text = `${vehicle?.make || ''} ${vehicle?.model || ''}`;
  return brandRules.find((x) => x[1].test(text))?.[0] || 'generic';
}

export function resolveLogo(vehicle, brandLogos = [], customLogo = '') {
  if (customLogo) return customLogo;
  const key = brandKey(vehicle);
  const meta = brandLogos.find((b) => b.key === key);
  const source = meta?.png || meta?.file || meta?.fallback;
  if (source) return `/${source.replace(/^assets\//, '')}`;
  const label = vehicle?.make?.slice(0, 8) || '?';
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#e5e7eb"/><text x="50" y="56" text-anchor="middle" font-size="14" fill="#374151" font-weight="bold">${label}</text></svg>`)}`;
}
