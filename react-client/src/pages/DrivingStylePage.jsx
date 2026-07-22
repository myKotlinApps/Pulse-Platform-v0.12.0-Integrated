import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const metricsData = [
  { label: 'Acceleration',   key: 'accel',        score: 78, tip: 'Smooth throttle inputs improve fuel economy.' },
  { label: 'Braking',        key: 'braking',      score: 82, tip: 'Anticipate stops to reduce hard braking.' },
  { label: 'Cornering',      key: 'cornering',    score: 70, tip: 'Slow down before turns for better control.' },
  { label: 'Speed Consistency', key: 'speedConsistency', score: 85, tip: 'Cruise control helps maintain steady speed.' },
  { label: 'Idle Time',      key: 'idleTime',     score: 60, tip: 'Turn off engine during long stops.' },
  { label: 'Night Driving',  key: 'nightDriving', score: 75, tip: 'Reduce speed and increase following distance at night.' },
];

function ScoreRing({ score, size = 140 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1d3557" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-ecu-bright">{score}</span>
        <span className="text-xs text-ecu-muted">Score</span>
      </div>
    </div>
  );
}

function ProgressBar({ label, score, tip }) {
  const color = score >= 80 ? 'bg-ecu-green' : score >= 60 ? 'bg-ecu-amber' : 'bg-ecu-red';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ecu-bright">{label}</span>
        <span className="text-sm font-bold" style={{ color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }}>
          {score}
        </span>
      </div>
      <div className="w-full h-2 bg-ecu-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {tip && <div className="text-xs text-ecu-muted italic">💡 {tip}</div>}
    </div>
  );
}

export default function DrivingStylePage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const demoMode = useAppStore((s) => s.demoMode);
  const [metrics, setMetrics] = useState(metricsData);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    setActivePage('drivingstyle');
  }, [setActivePage]);

  useEffect(() => {
    let interval;
    if (demoMode) {
      interval = setInterval(() => {
        setMetrics((prev) =>
          prev.map((m) => ({
            ...m,
            score: Math.max(20, Math.min(98, m.score + (Math.random() - 0.5) * 6)),
          }))
        );
      }, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [demoMode]);

  useEffect(() => {
    const avg = Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length);
    setOverallScore(avg);
  }, [metrics]);

  const label = overallScore >= 80 ? 'Smooth Driver' : overallScore >= 60 ? 'Average Driver' : 'Aggressive Driver';

  return (
    <div className="animate-in space-y-5">
      <h2 className="text-lg font-bold text-ecu-bright">Driving Style Analysis</h2>

      {/* Overall Score */}
      <div className="glass-card flex flex-col items-center">
        <ScoreRing score={overallScore} size={140} />
        <span
          className="mt-2 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: overallScore >= 80 ? 'rgba(16,185,129,0.15)' : overallScore >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
            color: overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444',
          }}
        >
          {label}
        </span>
      </div>

      {/* Metric Bars */}
      <div className="glass-card space-y-4">
        <h3 className="text-sm font-semibold text-ecu-bright mb-2">Driving Metrics</h3>
        {metrics.map((m) => (
          <ProgressBar key={m.key} label={m.label} score={Math.round(m.score)} tip={m.tip} />
        ))}
      </div>

      {/* Tips Section */}
      <div className="glass-card border-ecu-green/20 bg-ecu-green/5">
        <h3 className="text-sm font-semibold text-ecu-green mb-2">Driving Tips</h3>
        <ul className="space-y-1.5 text-sm text-ecu-muted">
          <li>• Maintain steady speed on highways for best fuel economy</li>
          <li>• Avoid rapid acceleration — it can increase fuel use by 30%</li>
          <li>• Service your vehicle regularly for optimal performance</li>
          <li>• Check tire pressure monthly — underinflated tires waste fuel</li>
          <li>• Use engine braking when possible to save brake pads</li>
        </ul>
      </div>
    </div>
  );
}
