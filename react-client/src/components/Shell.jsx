import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';

const THEME_CYCLE = [
  'mydiag', 'dark', 'ivory',
  'neon-analytics', 'color-metrics', 'mobile-gradient', 'industrial-infographic',
];

const NAV_ITEMS = [
  { id: 'home', path: '/', label: 'خانه MyDiag', icon: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z' },
  { id: 'dashboard', path: '/dashboard', label: 'داشبورد', icon: 'M4 15a8 8 0 1 1 16 0M12 15l4-5M12 15a1 1 0 1 0 0-2' },
  { id: 'vehicles', path: '/vehicles', label: 'خودرو', icon: 'M5 11l2-5h10l2 5M3 14h18v5H3zM6 19v2M18 19v2' },
  { id: 'trips', path: '/trips', label: 'سفرها', icon: 'M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 18c7 0 1-10 8-10' },
  { id: 'analysis', path: '/analysis', label: 'تحلیل ماشین من', icon: 'M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M7 12h10M12 7v10' },
  { id: 'store', path: '/store', label: 'خرید و فعال‌سازی', icon: 'M4 9h16l-1 12H5zM7 9l1-6h8l1 6M9 13h6' },
  { id: 'errors', path: '/errors', label: 'خطا و پشتیبانی', icon: 'M12 3 2 21h20zM12 9v5M12 18h.01' },
  { id: 'scanner', path: '/scanner', label: 'اسکنر ECU', icon: 'M8 3v5M16 3v5M6 8h12v3a6 6 0 0 1-6 6v4M9 21h6' },
  { id: 'settings', path: '/settings', label: 'تنظیمات', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1A7 7 0 0 0 15 6l-.3-2.5h-4L10.4 6A7 7 0 0 0 8.7 7L6.4 6l-2 3.4L6.3 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1A7 7 0 0 0 10 18l.3 2.5h4L14.6 18a7 7 0 0 0 1.7-1l2.3 1 2-3.4-1.9-1.5a7 7 0 0 0 .3-1.1zM12 15z' },
];

const PAGE_TITLES = {
  home: ['SMART VEHICLE', 'خانه خودرو'],
  dashboard: ['LIVE VEHICLE', 'داشبورد خودرو'],
  vehicles: ['VEHICLE PROFILE', 'انتخاب خودرو'],
  trips: ['GPS TRIP LOGGER', 'سفرها'],
  analysis: ['DIAGEMAN API', 'تحلیل ماشین من'],
  store: ['UPGRADE', 'خرید و فعال‌سازی'],
  errors: ['FAULT CENTER', 'خطا و پشتیبانی'],
  scanner: ['ELM327 CONSOLE', 'اسکنر و کنسول ECU'],
  settings: ['SETTINGS', 'تنظیمات'],
  pro: ['ADVANCED CENTER', 'مرکز نسخه پیشرفته'],
  procenter: ['ADVANCED CENTER', 'مرکز نسخه پیشرفته'],
  'driving-style': ['DRIVING STYLE', 'سبک رانندگی'],
  parking: ['PARKING MEMORY', 'محل پارک'],
  dashcam: ['DASHCAM', 'دوربین خودرو'],
};

export default function Shell({ children }) {
  const navigate = useNavigate();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const plan = useAppStore((s) => s.plan);
  const activePage = useAppStore((s) => s.activePage);
  const title = PAGE_TITLES[activePage] || PAGE_TITLES.home;

  function cycleTheme() {
    const i = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(i + 1) % THEME_CYCLE.length]);
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="w-64 bg-ecu-surface border-l border-ecu-border flex flex-col shrink-0 hidden lg:flex">
        <div className="p-4 border-b border-ecu-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ecu-accent rounded-lg flex items-center justify-center font-bold text-sm">EP</div>
            <div>
              <strong className="text-sm">ECU Pulse</strong>
              <small className="block text-[0.65rem] text-ecu-muted">DIAGEMAN.IR</small>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right text-sm transition-colors ${
                activePage === item.id ? 'bg-ecu-card border border-ecu-border text-ecu-accent' : 'hover:bg-ecu-card/50 text-ecu-muted hover:text-ecu-bright'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-ecu-border">
          <span className="text-xs text-ecu-muted uppercase">{plan === 'pro' ? 'PRO' : 'FREE'}</span>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-ecu-surface border-b border-ecu-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-xl" onClick={() => navigate('/')}>☰</button>
            <div>
              <small className="block text-[0.6rem] text-ecu-muted tracking-wider">{title[0]}</small>
              <strong className="text-sm">{title[1]}</strong>
            </div>
          </div>
          <button onClick={cycleTheme} className="w-8 h-8 rounded-lg border border-ecu-border flex items-center justify-center hover:border-ecu-accent transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-in">
          {children}
        </main>
      </div>
    </div>
  );
}
