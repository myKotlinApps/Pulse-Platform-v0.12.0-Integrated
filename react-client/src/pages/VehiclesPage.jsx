import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { fa } from '../services/format';
import { resolveLogo } from '../services/logoResolver';

export default function VehiclesPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const plan = useAppStore((s) => s.plan);
  const vehicles = useAppStore((s) => s.vehicles);
  const vehicleIndex = useAppStore((s) => s.vehicleIndex);
  const setVehicleIndex = useAppStore((s) => s.setVehicleIndex);
  const demo = useAppStore((s) => s.demo);
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const demoMode = useAppStore((s) => s.demoMode);
  const brandLogos = useAppStore((s) => s.brandLogos);
  const [make, setMake] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setActivePage('vehicles');
  }, [setActivePage]);

  const allowedVehicles = useMemo(() => {
    const passenger = vehicles.filter((v) => v.segment === 'passenger');
    if (plan === 'pro') return vehicles;
    return passenger.slice(0, Math.max(8, Math.ceil(passenger.length * 0.1)));
  }, [vehicles, plan]);

  const makes = useMemo(() => [...new Set(allowedVehicles.map((v) => v.make))].sort((a, b) => a.localeCompare(b, 'fa')),
    [allowedVehicles]);

  useEffect(() => {
    if (!make && makes.length) setMake(makes[0]);
  }, [make, makes]);

  const filtered = allowedVehicles.filter((v) => {
    const text = `${v.make} ${v.model} ${v.profile || ''}`.toLowerCase();
    const matchMake = !make || v.make === make;
    const matchQuery = !query || text.includes(query.toLowerCase());
    return matchMake && matchQuery;
  });

  const activate = (vehicle) => {
    setVehicleIndex(vehicle.index ?? vehicles.indexOf(vehicle));
  };

  return (
    <div className="animate-in space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <small className="text-ecu-muted text-xs">FREE CATALOG = 10%</small>
          <h2 className="text-lg font-bold text-ecu-bright">انتخاب خودرو</h2>
        </div>
        <span className="px-3 py-1 rounded-full text-xs border border-ecu-border text-ecu-accent">
          {plan === 'pro' ? 'کاتالوگ کامل' : `رایگان ${fa(allowedVehicles.length)} خودرو`}
        </span>
      </div>

      <section className="glass-card grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <select className="field" value={make} onChange={(e) => setMake(e.target.value)}>
          {makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی مدل یا پروفایل" />
        <button className="btn-primary" onClick={() => setDemoMode(true)}>شروع دمو</button>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {demo?.vehicle && (
          <button className={`vehicle-tile ${demoMode ? 'selected' : ''}`} onClick={() => setDemoMode(true)}>
            <div className="logo-frame"><span className="text-3xl">?</span></div>
            <strong>{demo.vehicle.model}</strong>
            <small>{demo.vehicle.make} · بدون اتصال واقعی</small>
          </button>
        )}
        {filtered.map((v) => (
          <button key={`${v.index}-${v.make}-${v.model}`} className={`vehicle-tile ${!demoMode && v.index === vehicleIndex ? 'selected' : ''}`} onClick={() => activate(v)}>
            <div className="logo-frame"><img src={resolveLogo(v, brandLogos)} alt="" /></div>
            <strong>{v.model}</strong>
            <small>{v.make}</small>
          </button>
        ))}
      </section>

      {filtered.length === 0 && <div className="glass-card text-center text-sm text-ecu-muted">نتیجه‌ای برای این جستجو پیدا نشد.</div>}
    </div>
  );
}
