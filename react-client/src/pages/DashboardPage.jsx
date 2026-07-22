import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const gauges = [
  { key: 'rpm',         label: 'RPM',         min: 0, max: 8000,  unit: '',       color: '#ef4444', bgColor: '#1d3557' },
  { key: 'speedKph',    label: 'Speed',       min: 0, max: 240,   unit: 'km/h',   color: '#3b82f6', bgColor: '#1d3557' },
  { key: 'coolantC',    label: 'Coolant',     min: 60, max: 120,  unit: '°C',     color: '#f59e0b', bgColor: '#1d3557' },
  { key: 'voltage',     label: 'Voltage',     min: 10, max: 16,   unit: 'V',      color: '#10b981', bgColor: '#1d3557' },
  { key: 'engineLoad',  label: 'Engine Load', min: 0, max: 100,   unit: '%',      color: '#a855f7', bgColor: '#1d3557' },
];

function GaugeRing({ value, min, max, label, unit, color, bgColor, size = 120 }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, ((value ?? min) - min) / (max - min)));
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-ecu-bright">{value ?? '--'}</span>
          {unit && <span className="text-xs text-ecu-muted">{unit}</span>}
        </div>
      </div>
      <span className="text-xs font-medium text-ecu-muted">{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const live = useAppStore((s) => s.live);
  const demoMode = useAppStore((s) => s.demoMode);
  const updateLive = useAppStore((s) => s.updateLive);
  const intervalRef = useRef(null);
  const [display, setDisplay] = useState(live);

  useEffect(() => {
    setActivePage('dashboard');
  }, [setActivePage]);

  useEffect(() => {
    if (demoMode) {
      intervalRef.current = setInterval(() => {
        setDisplay({
          rpm: Math.round(800 + Math.random() * 3200),
          speedKph: Math.round(20 + Math.random() * 100),
          coolantC: Math.round(80 + Math.random() * 20),
          voltage: (12 + Math.random() * 2).toFixed(1),
          engineLoad: Math.round(15 + Math.random() * 60),
        });
      }, 800);
    } else {
      setDisplay(live);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [demoMode, live]);

  useEffect(() => {
    if (demoMode && display.rpm !== undefined) {
      updateLive(display);
    }
  }, [display, demoMode, updateLive]);

  return (
    <div className="animate-in space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ecu-bright">Live Dashboard</h2>
        {demoMode && (
          <span className="flex items-center gap-1.5 text-xs text-ecu-green">
            <span className="w-2 h-2 rounded-full bg-ecu-green animate-pulse" />
            Simulating
          </span>
        )}
      </div>

      <div className="glass-card">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
          {gauges.map((g) => (
            <GaugeRing
              key={g.key}
              value={display[g.key]}
              label={g.label}
              min={g.min}
              max={g.max}
              unit={g.unit}
              color={g.color}
              bgColor={g.bgColor}
            />
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold text-ecu-bright mb-3">Sensor Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: 'RPM', value: `${display.rpm ?? '--'}` },
            { label: 'Speed', value: `${display.speedKph ?? '--'} km/h` },
            { label: 'Coolant Temp', value: `${display.coolantC ?? '--'} °C` },
            { label: 'Voltage', value: `${display.voltage ?? '--'} V` },
            { label: 'Engine Load', value: `${display.engineLoad ?? '--'} %` },
            { label: 'Intake Temp', value: `${Math.round(20 + Math.random() * 15)} °C` },
            { label: 'Fuel Level', value: `${Math.round(30 + Math.random() * 70)} %` },
            { label: 'Throttle', value: `${Math.round(10 + Math.random() * 30)} %` },
          ].map((row) => (
            <div key={row.label} className="flex justify-between bg-ecu-surface rounded-lg px-3 py-2">
              <span className="text-ecu-muted">{row.label}</span>
              <span className="text-ecu-bright font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
