import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { normalizedDemoTrip } from '../services/demo';
import { fa, formatTime, tripSummary } from '../services/format';

function OfflineMap({ trip, replayIndex }) {
  const points = trip?.points || [];
  const projected = useMemo(() => {
    if (!points.length) return [];
    const minLat = Math.min(...points.map((p) => p.lat));
    const maxLat = Math.max(...points.map((p) => p.lat));
    const minLon = Math.min(...points.map((p) => p.lon));
    const maxLon = Math.max(...points.map((p) => p.lon));
    const pad = 58;
    const w = 884;
    const h = 504;
    return points.map((p) => ({
      x: pad + ((p.lon - minLon) / (maxLon - minLon || 1)) * w,
      y: 560 - ((p.lat - minLat) / (maxLat - minLat || 1)) * h,
    }));
  }, [points]);

  const route = projected.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const trail = projected.slice(0, Math.max(1, replayIndex + 1)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const car = projected[Math.max(0, Math.min(replayIndex, projected.length - 1))] || { x: 70, y: 480 };

  return (
    <div className="offline-map">
      <svg viewBox="0 0 1000 620" role="img" className="w-full h-full">
        <defs>
          <pattern id="minorGridReact" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="rgba(139,157,178,.12)" strokeWidth="1" /></pattern>
          <filter id="routeGlowReact"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <rect width="1000" height="620" fill="#081727"/><rect width="1000" height="620" fill="url(#minorGridReact)"/>
        <g className="offline-roads">
          <path d="M70 480 C240 470 380 450 520 420 S790 370 930 350" />
          <path d="M150 560 C270 450 350 360 460 300 S700 190 860 120" />
          <path d="M80 310 C270 310 390 325 560 300 S800 250 950 245" />
          <path d="M470 560 C500 450 520 330 550 210 S580 90 610 35" />
        </g>
        <g className="offline-labels">
          <text x="75" y="505">غرب تهران · آزادی</text>
          <text x="770" y="380">شرق تهران · تهرانپارس</text>
          <text x="700" y="105">شمال تهران</text>
        </g>
        <polyline points={route} fill="none" stroke="#2a758b" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
        <polyline points={trail} fill="none" stroke="#55dff6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="url(#routeGlowReact)" />
        {(trip?.stops || []).map((s, i) => {
          const nearest = projected[Math.min(projected.length - 1, Math.floor((i + 1) * projected.length / ((trip.stops || []).length + 1)))] || car;
          return (
            <g key={s.nameFa || i}>
              <circle cx={nearest.x} cy={nearest.y} r="8" fill="#ff6d7a" stroke="#fff" strokeWidth="3" />
              <text x={nearest.x + 12} y={nearest.y - 10} fill="#f4f8fc" fontSize="14">{s.nameFa || 'توقف'}</text>
            </g>
          );
        })}
        <g transform={`translate(${car.x.toFixed(1)} ${car.y.toFixed(1)})`}>
          <rect x="-23" y="-18" width="46" height="30" rx="10" fill="#ff9a54" stroke="#fff" strokeWidth="2" />
          <circle cx="-13" cy="15" r="7" fill="#0f2030" stroke="#fff" strokeWidth="1.5" />
          <circle cx="13" cy="15" r="7" fill="#0f2030" stroke="#fff" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

export default function TripsPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const trips = useAppStore((s) => s.trips);
  const addTrip = useAppStore((s) => s.addTrip);
  const removeTrip = useAppStore((s) => s.removeTrip);
  const demo = useAppStore((s) => s.demo);
  const [selectedId, setSelectedId] = useState('');
  const [playing, setPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => { setActivePage('trips'); }, [setActivePage]);
  useEffect(() => { if (!selectedId && trips.length) setSelectedId(trips[0].id); }, [trips, selectedId]);
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const selectedTrip = trips.find((t) => t.id === selectedId) || trips[0];
  const summary = tripSummary(selectedTrip?.points || []);

  const loadDemoTrip = () => {
    const trip = normalizedDemoTrip(demo?.demoTrip);
    if (!trip) return;
    if (!trips.some((t) => t.id === trip.id)) addTrip(trip);
    setSelectedId(trip.id);
    setReplayIndex(0);
  };

  const play = () => {
    if (!selectedTrip?.points?.length) return;
    clearInterval(intervalRef.current);
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setReplayIndex((i) => {
        if (i >= selectedTrip.points.length - 1) {
          clearInterval(intervalRef.current);
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 450);
  };

  const pause = () => { clearInterval(intervalRef.current); setPlaying(false); };
  const restart = () => { pause(); setReplayIndex(0); };

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <small className="text-ecu-muted text-xs">GPS TRIP LOGGER · OFFLINE SAFE</small>
          <h2 className="text-lg font-bold text-ecu-bright">ثبت و بازپخش مسیر</h2>
        </div>
        <button className="btn-primary text-sm" onClick={loadDemoTrip}>بارگذاری سفر نمایشی تهران</button>
      </div>

      <section className="grid lg:grid-cols-[1.4fr_.8fr] gap-4">
        <div className="glass-card !p-0 overflow-hidden">
          <div className="map-toolbar"><strong>نقشه آفلاین آماده است</strong><span>Offline SVG</span></div>
          <OfflineMap trip={selectedTrip} replayIndex={replayIndex} />
        </div>
        <div className="glass-card space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <article className="trip-stat"><span>مسافت</span><strong>{fa((summary.distance / 1000).toFixed(2))} km</strong></article>
            <article className="trip-stat"><span>زمان حرکت</span><strong>{formatTime(summary.moving)}</strong></article>
            <article className="trip-stat"><span>توقف</span><strong>{formatTime(summary.stopped)}</strong></article>
            <article className="trip-stat"><span>حداکثر سرعت</span><strong>{fa(Math.round(summary.max))}</strong></article>
          </div>
          <select className="field" value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setReplayIndex(0); }}>
            {trips.map((t) => <option key={t.id} value={t.id}>{t.titleFa || t.name || t.id}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            <button className="btn-ghost flex-1" onClick={playing ? pause : play}>{playing ? 'مکث' : 'پخش'}</button>
            <button className="btn-ghost flex-1" onClick={restart}>از ابتدا</button>
            <button className="btn-ghost flex-1" onClick={() => selectedTrip && !selectedTrip.demo && removeTrip(selectedTrip.id)}>حذف</button>
          </div>
          <input className="w-full" type="range" min="0" max={Math.max(0, (selectedTrip?.points?.length || 1) - 1)} value={replayIndex} onChange={(e) => { pause(); setReplayIndex(Number(e.target.value)); }} />
          <p className="text-xs text-ecu-muted">{selectedTrip?.points?.[replayIndex]?.label || 'نقطه مسیر'} · {fa(replayIndex + 1)} / {fa(selectedTrip?.points?.length || 0)}</p>
        </div>
      </section>
    </div>
  );
}
