import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const healthItems = [
  { id: 'engine',       label: 'Engine',        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z' },
  { id: 'transmission', label: 'Transmission',   icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' },
  { id: 'brakes',       label: 'Brakes',         icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 9H9V8h2v2zm0 4H9v-2h2v2zm4-4h-2V8h2v2zm0 4h-2v-2h2v2z' },
  { id: 'battery',      label: 'Battery',        icon: 'M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18h-2v-2h2v2zm0-4h-2V9h2v5z' },
  { id: 'emissions',    label: 'Emissions',      icon: 'M19.14 7.5A2.99 2.99 0 0016.17 4H7.83A2.99 2.99 0 004.86 7.5L3 16h18l-1.86-8.5zM12 18c-1.66 0-3-1.34-3-3h6c0 1.66-1.34 3-3 3z' },
  { id: 'cooling',      label: 'Cooling',        icon: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 11h-2.5v2.5h-2V16H11v-2h2.5v-2.5h2V14H18v2z' },
  { id: 'electrical',   label: 'Electrical',     icon: 'M13 2v3h3v2h-3v2h3v2h-3v3h-2v-3H8v-2h3V7H8V5h3V2h2zM4 20h16v2H4v-2z' },
  { id: 'suspension',   label: 'Suspension',     icon: 'M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z' },
];

const statuses = ['good', 'warning', 'bad'];

function getRandomStatus() {
  const r = Math.random();
  if (r < 0.6) return 'good';
  if (r < 0.85) return 'warning';
  return 'bad';
}

const statusConfig = {
  good:    { color: '#10b981', bg: 'bg-ecu-green/10', border: 'border-ecu-green/30', text: 'text-ecu-green', label: 'OK' },
  warning: { color: '#f59e0b', bg: 'bg-ecu-amber/10', border: 'border-ecu-amber/30', text: 'text-ecu-amber', label: 'WARN' },
  bad:     { color: '#ef4444', bg: 'bg-ecu-red/10',   border: 'border-ecu-red/30',   text: 'text-ecu-red',   label: 'FAIL' },
};

export default function AnalysisPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const [results, setResults] = useState([]);
  const [score, setScore] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setActivePage('analysis');
  }, [setActivePage]);

  const runAnalysis = () => {
    setRunning(true);
    setResults([]);
    setScore(null);

    let i = 0;
    const items = [...healthItems];
    const interval = setInterval(() => {
      if (i >= items.length) {
        clearInterval(interval);
        setRunning(false);
        return;
      }
      const status = getRandomStatus();
      setResults((prev) => {
        const next = [...prev, { ...items[i], status }];
        const scores = { good: 100, warning: 50, bad: 0 };
        const total = next.reduce((sum, r) => sum + scores[r.status], 0);
        setScore(Math.round(total / next.length));
        return next;
      });
      i++;
    }, 400);
  };

  return (
    <div className="animate-in space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ecu-bright">ECU Analysis</h2>
        <button
          className="btn-primary text-sm"
          onClick={runAnalysis}
          disabled={running}
        >
          {running ? 'Running...' : '▶ Run Analysis'}
        </button>
      </div>

      {/* Score Summary */}
      {score !== null && (
        <div className="glass-card text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 mb-2"
            style={{
              borderColor: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
              color: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
            }}
          >
            <span className="text-2xl font-bold">{score}</span>
          </div>
          <div className="text-sm text-ecu-muted">
            {score >= 80 ? 'Vehicle Health: Good' : score >= 50 ? 'Vehicle Health: Fair' : 'Vehicle Health: Poor'}
          </div>
          <div className="text-xs text-ecu-muted mt-1">DiaGeman API</div>
        </div>
      )}

      {/* Health Items */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold text-ecu-bright mb-3">Health Check Items</h3>
        {results.length === 0 && !running && (
          <p className="text-sm text-ecu-muted text-center py-4">
            Press "Run Analysis" to scan vehicle systems.
          </p>
        )}
        {running && results.length === 0 && (
          <p className="text-sm text-ecu-muted text-center py-4 animate-pulse">
            Connecting to DiaGeman...
          </p>
        )}
        <div className="space-y-2">
          {results.map((item) => {
            const cfg = statusConfig[item.status];
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${cfg.text}`}>
                  <path d={item.icon} />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ecu-bright">{item.label}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
