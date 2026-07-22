import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const features = [
  { name: 'Full OBD-II Access',         free: true,  pro: true  },
  { name: 'Live Dashboard Gauges',      free: true,  pro: true  },
  { name: 'DTC Error Code Reader',      free: true,  pro: true  },
  { name: 'Trip History & Replay',      free: false, pro: true  },
  { name: 'ECU Health Analysis',        free: false, pro: true  },
  { name: 'Cloud Sync & Backup',        free: false, pro: true  },
  { name: 'Advanced Driving Analytics', free: false, pro: true  },
  { name: 'Priority Support',           free: false, pro: true  },
];

export default function ProCenterPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const plan = useAppStore((s) => s.plan);
  const setPlan = useAppStore((s) => s.setPlan);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setActivePage('procenter');
  }, [setActivePage]);

  const handleUpgrade = () => {
    if (code.trim() === '1234') {
      setPlan('pro');
      setMessage('✅ Upgrade successful! You are now on Pro.');
    } else {
      setMessage('❌ Invalid code. Please try again.');
    }
  };

  const isPro = plan === 'pro';

  return (
    <div className="animate-in space-y-5">
      {/* Banner */}
      <div
        className={`glass-card text-center ${
          isPro
            ? 'border-ecu-green/30 bg-ecu-green/5'
            : 'border-ecu-amber/30 bg-ecu-amber/5'
        }`}
      >
        <div className={`text-3xl font-bold mb-1 ${isPro ? 'text-ecu-green' : 'text-ecu-amber'}`}>
          {isPro ? 'Pro Active' : 'Free Plan'}
        </div>
        <p className="text-sm text-ecu-muted">
          {isPro
            ? 'You have full access to all Pro features.'
            : 'Unlock advanced features with Pro.'}
        </p>
        {!isPro && !showInput && (
          <button
            className="btn-primary mt-3"
            onClick={() => setShowInput(true)}
          >
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* Upgrade Code Input */}
      {!isPro && showInput && (
        <div className="glass-card space-y-3">
          <label className="text-sm text-ecu-bright font-medium">Enter Pro Code</label>
          <input
            className="w-full bg-ecu-surface border border-ecu-border rounded-xl px-3 py-2 text-sm text-ecu-bright placeholder:text-ecu-muted outline-none focus:border-ecu-accent"
            placeholder="Enter upgrade code..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUpgrade()}
          />
          <button className="btn-primary w-full" onClick={handleUpgrade}>
            Activate Pro
          </button>
          {message && (
            <p className={`text-sm text-center ${message.startsWith('✅') ? 'text-ecu-green' : 'text-ecu-red'}`}>
              {message}
            </p>
          )}
          <p className="text-xs text-ecu-muted text-center">Hint: Use code "1234"</p>
        </div>
      )}

      {/* Feature Comparison Table */}
      <div className="glass-card overflow-x-auto">
        <h3 className="text-sm font-semibold text-ecu-bright mb-3">Feature Comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ecu-border">
              <th className="text-left py-2 text-ecu-muted font-medium">Feature</th>
              <th className="text-center py-2 text-ecu-muted font-medium">Free</th>
              <th className="text-center py-2 text-ecu-accent font-medium">Pro</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.name} className="border-b border-ecu-border/50">
                <td className="py-3 text-ecu-bright">{f.name}</td>
                <td className="text-center py-3">
                  {f.free ? (
                    <span className="text-ecu-green font-bold">✔</span>
                  ) : (
                    <span className="text-ecu-red font-bold">✕</span>
                  )}
                </td>
                <td className="text-center py-3">
                  <span className="text-ecu-green font-bold">✔</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Locked/Unlocked Visual */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`glass-card text-center ${isPro ? 'border-ecu-green/30' : 'opacity-50'}`}>
          <div className="text-2xl mb-1">{isPro ? '🔓' : '🔒'}</div>
          <div className="text-sm font-semibold text-ecu-bright">Advanced Analytics</div>
          <div className="text-xs text-ecu-muted">{isPro ? 'Unlocked' : 'Locked'}</div>
        </div>
        <div className={`glass-card text-center ${isPro ? 'border-ecu-green/30' : 'opacity-50'}`}>
          <div className="text-2xl mb-1">{isPro ? '🔓' : '🔒'}</div>
          <div className="text-sm font-semibold text-ecu-bright">Cloud Sync</div>
          <div className="text-xs text-ecu-muted">{isPro ? 'Unlocked' : 'Locked'}</div>
        </div>
        <div className={`glass-card text-center ${isPro ? 'border-ecu-green/30' : 'opacity-50'}`}>
          <div className="text-2xl mb-1">{isPro ? '🔓' : '🔒'}</div>
          <div className="text-sm font-semibold text-ecu-bright">Priority Support</div>
          <div className="text-xs text-ecu-muted">{isPro ? 'Unlocked' : 'Locked'}</div>
        </div>
        <div className={`glass-card text-center ${isPro ? 'border-ecu-green/30' : 'opacity-50'}`}>
          <div className="text-2xl mb-1">{isPro ? '🔓' : '🔒'}</div>
          <div className="text-sm font-semibold text-ecu-bright">Trip Replay</div>
          <div className="text-xs text-ecu-muted">{isPro ? 'Unlocked' : 'Locked'}</div>
        </div>
      </div>
    </div>
  );
}
