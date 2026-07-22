import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const themes = [
  { id: 'mydiag',    label: 'MyDiag Blue', color: '#1a73e8' },
  { id: 'midnight',  label: 'Midnight',    color: '#6366f1' },
  { id: 'emerald',   label: 'Emerald',     color: '#10b981' },
  { id: 'sunset',    label: 'Sunset',      color: '#f59e0b' },
  { id: 'rose',      label: 'Rose',        color: '#f43f5e' },
  { id: 'mono',      label: 'Monochrome',  color: '#94a3b8' },
  { id: 'cyber',     label: 'Cyberpunk',   color: '#06b6d4' },
];

export default function SettingsPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const demoMode = useAppStore((s) => s.demoMode);
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const plan = useAppStore((s) => s.plan);
  const setPlan = useAppStore((s) => s.setPlan);
  const [apiUrl, setApiUrl] = useState('http://localhost:5000');
  const [proCode, setProCode] = useState('');
  const [proMsg, setProMsg] = useState('');

  useEffect(() => {
    setActivePage('settings');
  }, [setActivePage]);

  const handleProCode = () => {
    if (proCode.trim() === '1234') {
      setPlan('pro');
      setProMsg('✅ Pro activated!');
    } else {
      setProMsg('❌ Invalid code');
    }
  };

  return (
    <div className="animate-in space-y-5">
      <h2 className="text-lg font-bold text-ecu-bright">Settings</h2>

      {/* Theme Picker */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold text-ecu-bright mb-3">Theme</h3>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-colors ${
                theme === t.id
                  ? 'border-ecu-accent bg-ecu-accent/10'
                  : 'border-ecu-border bg-ecu-surface hover:border-ecu-accent/50'
              }`}
              onClick={() => setTheme(t.id)}
            >
              <span
                className="w-6 h-6 rounded-full border-2"
                style={{
                  backgroundColor: t.color,
                  borderColor: theme === t.id ? '#ccd6f6' : 'transparent',
                }}
              />
              <span className="text-xs text-ecu-muted">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Demo Mode + Pro Code */}
      <div className="glass-card space-y-4">
        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ecu-bright">Demo Mode</div>
            <div className="text-xs text-ecu-muted">Simulate sensor data without hardware</div>
          </div>
          <button
            className={`relative w-12 h-7 rounded-full transition-colors ${
              demoMode ? 'bg-ecu-green' : 'bg-ecu-border'
            }`}
            onClick={() => setDemoMode(!demoMode)}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                demoMode ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <hr className="border-ecu-border" />

        {/* Pro Code */}
        <div>
          <div className="text-sm font-semibold text-ecu-bright mb-2">Pro Activation Code</div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-ecu-surface border border-ecu-border rounded-xl px-3 py-2 text-sm text-ecu-bright placeholder:text-ecu-muted outline-none focus:border-ecu-accent"
              placeholder="Enter code (e.g. 1234)"
              value={proCode}
              onChange={(e) => setProCode(e.target.value)}
              disabled={plan === 'pro'}
              onKeyDown={(e) => e.key === 'Enter' && handleProCode()}
            />
            <button
              className="btn-primary text-sm"
              onClick={handleProCode}
              disabled={plan === 'pro'}
            >
              {plan === 'pro' ? 'Active' : 'Activate'}
            </button>
          </div>
          {proMsg && (
            <p className={`text-xs mt-1 ${proMsg.startsWith('✅') ? 'text-ecu-green' : 'text-ecu-red'}`}>
              {proMsg}
            </p>
          )}
        </div>
      </div>

      {/* API Server URL */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold text-ecu-bright mb-2">API Server URL</h3>
        <input
          className="w-full bg-ecu-surface border border-ecu-border rounded-xl px-3 py-2 text-sm font-mono text-ecu-bright outline-none focus:border-ecu-accent"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="http://localhost:5000"
        />
        <p className="text-xs text-ecu-muted mt-1.5">DiaGeman API backend endpoint</p>
      </div>

      {/* App Info */}
      <div className="glass-card space-y-2">
        <h3 className="text-sm font-semibold text-ecu-bright mb-2">About</h3>
        <div className="flex justify-between text-sm">
          <span className="text-ecu-muted">App Version</span>
          <span className="text-ecu-bright font-medium">v0.12.0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ecu-muted">Plan</span>
          <span className={`font-medium uppercase ${plan === 'pro' ? 'text-ecu-green' : 'text-ecu-amber'}`}>
            {plan}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ecu-muted">Theme</span>
          <span className="text-ecu-bright font-medium capitalize">{theme}</span>
        </div>
      </div>

      {/* Account Info Placeholder */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold text-ecu-bright mb-2">Account</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ecu-accent/20 flex items-center justify-center text-ecu-accent font-bold">
            U
          </div>
          <div>
            <div className="text-sm font-semibold text-ecu-bright">User</div>
            <div className="text-xs text-ecu-muted">user@mydiag.app</div>
          </div>
        </div>
        <p className="text-xs text-ecu-muted mt-3">Account management coming soon.</p>
      </div>
    </div>
  );
}
