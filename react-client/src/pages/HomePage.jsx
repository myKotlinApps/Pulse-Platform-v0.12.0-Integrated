import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { fa } from '../services/format';
import { resolveLogo } from '../services/logoResolver';

const menuItems = [
  { id: 'dashboard', path: '/dashboard', label: 'داشبورد خودرو', sub: 'گیج‌ها و داده زنده', icon: 'M3 13h4V3H3v10zm6-8v6h4V5H9zm-6 8h4v4H3v-4zm6 4v-6h4v6H9z', color: 'text-ecu-accent' },
  { id: 'vehicles', path: '/vehicles', label: 'ثبت خودرو', sub: 'کاتالوگ و لوگو', icon: 'M21 7l-9-5-9 5v10l9 5 9-5V7zm-9-2.71l5.91 3.28-5.91 3.29-5.91-3.29L12 4.29zM5 14.17V9.72l7 3.89v4.45l-7-3.89zm9 4.45v-4.45l7-3.89v4.45l-7 3.89z', color: 'text-ecu-green' },
  { id: 'trips', path: '/trips', label: 'ثبت مسیر', sub: 'GPS و بازپخش', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', color: 'text-ecu-amber' },
  { id: 'analysis', path: '/analysis', label: 'تحلیل ماشین من', sub: 'امتیاز سلامت', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z', color: 'text-ecu-accent' },
  { id: 'scanner', path: '/scanner', label: 'اسکنر و اتصال', sub: 'ELM327 Console', icon: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h6v2H8v2h8v-2h-2v-2h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 12H5V5h14v9z', color: 'text-ecu-accent' },
  { id: 'drivingstyle', path: '/driving-style', label: 'سبک رانندگی', sub: 'شتاب و ترمز', icon: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.2L6 8.3V13h2V9.6l1.8-.7', color: 'text-ecu-accent' },
  { id: 'parking', path: '/parking', label: 'محل پارک', sub: 'ذخیره موقعیت', icon: 'M13 2v3h3v2h-3v2h3v2h-3v3h-2v-3H8v-2h3V7H8V5h3V2h2zM4 20h16v2H4v-2z', color: 'text-ecu-amber' },
  { id: 'dashcam', path: '/dashcam', label: 'دوربین خودرو', sub: 'ویدئوی محلی', icon: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z', color: 'text-ecu-red' },
  { id: 'procenter', path: '/procenter', label: 'ارتقای Pro', sub: 'امکانات پیشرفته', icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 9H9V8h2v2zm0 4H9v-2h2v2zm4-4h-2V8h2v2zm0 4h-2v-2h2v2z', color: 'text-ecu-green' },
  { id: 'store', path: '/store', label: 'فروشگاه تجهیزات', sub: 'اشتراک و دانگل', icon: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM6.15 5l.26 2h11.18l1.26-2H6.15zM5.8 3h12.4c.66 0 1.19.43 1.37 1.05L21 9H3l1.43-4.95C4.61 3.43 5.14 3 5.8 3z', color: 'text-ecu-amber' },
  { id: 'errors', path: '/errors', label: 'خطا و پشتیبانی', sub: 'گزارش رخدادها', icon: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z', color: 'text-ecu-red' },
  { id: 'settings', path: '/settings', label: 'تنظیمات', sub: 'ظاهر و API', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.484.484 0 00-.4-.31h-3.84c-.2 0-.36.12-.43.3l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.07.18.23.31.43.31h3.84c.2 0 .36-.12.43-.31l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z', color: 'text-ecu-muted' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const setActivePage = useAppStore((s) => s.setActivePage);
  const vehicles = useAppStore((s) => s.vehicles);
  const vehicleIndex = useAppStore((s) => s.vehicleIndex);
  const live = useAppStore((s) => s.live);
  const plan = useAppStore((s) => s.plan);
  const demoMode = useAppStore((s) => s.demoMode);
  const demo = useAppStore((s) => s.demo);
  const brandLogos = useAppStore((s) => s.brandLogos);
  const customLogo = useAppStore((s) => s.customLogo);

  useEffect(() => {
    setActivePage('home');
  }, [setActivePage]);

  const vehicle = demoMode ? demo?.vehicle : (vehicles[vehicleIndex] || vehicles[0]);
  const vehicleName = vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : 'خودروی فعال';
  const vehicleLogo = resolveLogo(vehicle, brandLogos, customLogo);

  const handleNavigate = (item) => {
    setActivePage(item.id);
    navigate(item.path);
  };

  return (
    <div className="animate-in space-y-5">
      {/* Hero Card */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img src={vehicleLogo} alt="" className="w-14 h-14 object-contain rounded-2xl bg-ecu-surface border border-ecu-border p-2" />
            <div>
              <h1 className="text-xl font-bold text-ecu-bright">{vehicleName}</h1>
              <p className="text-sm text-ecu-muted">{(vehicle?.protocols || []).join(' · ') || vehicle?.profile || 'Generic OBD-II'}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${plan === 'pro' ? 'bg-ecu-green/20 text-ecu-green border border-ecu-green/40' : 'bg-ecu-amber/20 text-ecu-amber border border-ecu-amber/40'}`}>
            {plan === 'pro' ? 'Pro' : 'Free'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-ecu-surface rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-ecu-bright">{fa(live.speedKph || 0)}</div>
            <div className="text-xs text-ecu-muted">km/h</div>
          </div>
          <div className="bg-ecu-surface rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-ecu-accent">{fa(live.rpm || 0)}</div>
            <div className="text-xs text-ecu-muted">RPM</div>
          </div>
          <div className="bg-ecu-surface rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-ecu-amber">{live.coolantC == null ? '--' : fa(live.coolantC)}</div>
            <div className="text-xs text-ecu-muted">°C Coolant</div>
          </div>
        </div>
        {demoMode && (
          <div className="mt-3 pt-3 border-t border-ecu-border flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ecu-green animate-pulse" />
            <span className="text-xs text-ecu-muted">اتصال شبیه‌ساز فعال است</span>
          </div>
        )}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className="menu-card"
            onClick={() => handleNavigate(item)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={item.color}>
              <path d={item.icon} />
            </svg>
            <strong className="text-ecu-bright text-xs leading-tight">{item.label}</strong>
            <small className="text-ecu-muted text-[0.65rem] leading-tight">{item.sub}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
