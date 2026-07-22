import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { getPlatform } from '../services/platform';

const demoLocation = { lat: 35.7219, lng: 51.3347 };

export default function ParkingPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const [parked, setParked] = useState(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const platform = getPlatform();

  useEffect(() => { setActivePage('parking'); }, [setActivePage]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ecuParking');
      if (saved) setParked(JSON.parse(saved));
    } catch {}
  }, []);

  const flash = (text) => { setMessage(text); setTimeout(() => setMessage(''), 3000); };

  const saveParking = () => {
    const persist = (location) => {
      const item = { ...location, timestamp: new Date().toLocaleString('fa-IR'), address: 'موقعیت ذخیره‌شده خودرو' };
      setParked(item);
      try { localStorage.setItem('ecuParking', JSON.stringify(item)); } catch {}
      flash('موقعیت پارک ذخیره شد.');
    };
    if (platform.supportsGeolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => persist({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => persist({ lat: demoLocation.lat + (Math.random() - 0.5) * 0.01, lng: demoLocation.lng + (Math.random() - 0.5) * 0.01 }),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      persist({ lat: demoLocation.lat, lng: demoLocation.lng });
    }
  };

  const clearParking = () => {
    setParked(null);
    try { localStorage.removeItem('ecuParking'); } catch {}
    flash('موقعیت پارک پاک شد.');
  };

  const findCar = () => flash(parked ? 'مسیریابی به خودرو آماده است.' : 'هنوز موقعیتی ذخیره نشده است.');
  const x = parked ? 500 + (parked.lng - demoLocation.lng) * 9000 : 500;
  const y = parked ? 310 - (parked.lat - demoLocation.lat) * 9000 : 310;

  return (
    <div className="animate-in space-y-4">
      <div><small className="text-ecu-muted text-xs">PARKING MEMORY</small><h2 className="text-lg font-bold text-ecu-bright">محل پارک خودرو</h2></div>

      <div className="glass-card !p-0 overflow-hidden">
        <div className="map-toolbar"><strong>{parked ? 'آخرین موقعیت ذخیره شده' : 'موقعیت ذخیره نشده'}</strong><span>Offline Map</span></div>
        <div className="offline-map" style={{ height: 320 }}>
          <svg viewBox="0 0 1000 620" className="w-full h-full">
            <rect width="1000" height="620" fill="#081727" />
            <path d="M90 500 C240 440 330 410 500 385 S780 340 930 260" fill="none" stroke="#29445c" strokeWidth="18" strokeLinecap="round" />
            <path d="M170 120 C300 200 450 265 560 390 S700 520 840 570" fill="none" stroke="#22394d" strokeWidth="12" strokeLinecap="round" />
            <text x="120" y="530" fill="#728aa1" fontSize="18">تهران</text>
            {parked && <g transform={`translate(${Math.max(60, Math.min(940, x))} ${Math.max(60, Math.min(560, y))})`}><circle r="20" fill="#ff6d7a" stroke="#fff" strokeWidth="4"/><text x="0" y="6" textAnchor="middle" fontSize="18" fill="#fff">P</text></g>}
          </svg>
        </div>
      </div>

      {message && <div className="glass-card text-center text-sm font-medium text-ecu-bright animate-in">{message}</div>}

      <div className="grid grid-cols-2 gap-3">
        <button className="glass-card text-center hover:border-ecu-accent transition-colors" onClick={saveParking}><div className="text-2xl mb-1">📍</div><div className="text-sm font-semibold text-ecu-bright">ذخیره موقعیت</div><div className="text-xs text-ecu-muted">محل پارک خودرو</div></button>
        <button className="glass-card text-center hover:border-ecu-accent transition-colors" onClick={findCar}><div className="text-2xl mb-1">🔍</div><div className="text-sm font-semibold text-ecu-bright">پیدا کردن خودرو</div><div className="text-xs text-ecu-muted">بازگشت به خودرو</div></button>
      </div>

      {parked && (
        <div className="glass-card space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-ecu-bright">جزئیات پارک</h3><button className="btn-ghost text-xs" onClick={clearParking}>حذف</button></div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-ecu-surface rounded-xl p-3"><div className="text-xs text-ecu-muted">زمان</div><div className="text-ecu-bright font-medium">{parked.timestamp}</div></div>
            <div className="bg-ecu-surface rounded-xl p-3"><div className="text-xs text-ecu-muted">آدرس</div><div className="text-ecu-bright font-medium">{parked.address}</div></div>
            <div className="bg-ecu-surface rounded-xl p-3"><div className="text-xs text-ecu-muted">Latitude</div><div className="text-ecu-bright font-mono text-sm">{parked.lat.toFixed(6)}</div></div>
            <div className="bg-ecu-surface rounded-xl p-3"><div className="text-xs text-ecu-muted">Longitude</div><div className="text-ecu-bright font-mono text-sm">{parked.lng.toFixed(6)}</div></div>
          </div>
          <textarea className="field resize-none" rows={2} placeholder="یادداشت مثل طبقه پارکینگ یا نزدیک آسانسور" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}
    </div>
  );
}
