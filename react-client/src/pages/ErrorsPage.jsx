import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';

const demoDtcs = [
  { code: 'P0133', description: 'O2 Sensor Circuit Slow Response (Bank 1 Sensor 1)', kind: 'pending' },
  { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold (Bank 1)', kind: 'confirmed' },
  { code: 'P0301', description: 'Cylinder 1 Misfire Detected', kind: 'permanent' },
];

const kindConfig = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: 'bg-ecu-amber/10', border: 'border-ecu-amber/30', text: 'text-ecu-amber' },
  confirmed: { label: 'Confirmed', color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  permanent: { label: 'Permanent', color: '#ef4444', bg: 'bg-ecu-red/10',   border: 'border-ecu-red/30',   text: 'text-ecu-red' },
};

export default function ErrorsPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const setDtcs = useAppStore((s) => s.setDtcs);
  const dtcs = useAppStore((s) => s.dtcs);
  const [log, setLog] = useState([]);

  useEffect(() => {
    setActivePage('errors');
  }, [setActivePage]);

  const loadDemo = () => {
    setDtcs(demoDtcs);
    setLog((prev) => [
      { time: new Date().toLocaleTimeString(), msg: 'Loaded 3 demo DTCs' },
      ...prev,
    ]);
  };

  const clearErrors = () => {
    setDtcs([]);
    setLog((prev) => [
      { time: new Date().toLocaleTimeString(), msg: 'All DTCs cleared' },
      ...prev,
    ]);
  };

  const sendReport = () => {
    if (dtcs.length === 0) {
      setLog((prev) => [
        { time: new Date().toLocaleTimeString(), msg: 'No DTCs to report' },
        ...prev,
      ]);
      return;
    }
    setLog((prev) => [
      { time: new Date().toLocaleTimeString(), msg: `Report sent — ${dtcs.length} DTC(s)` },
      ...prev,
    ]);
  };

  const currentDtcs = dtcs.length > 0 ? dtcs : []; 

  return (
    <div className="animate-in space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ecu-bright">Diagnostic Trouble Codes</h2>
        <div className="flex gap-2">
          <button className="btn-ghost text-sm" onClick={loadDemo}>Load Demo</button>
          <button className="btn-primary text-sm" onClick={clearErrors}>Clear All</button>
        </div>
      </div>

      {/* DTC Cards */}
      {currentDtcs.length === 0 ? (
        <div className="glass-card text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-sm text-ecu-muted">No error codes detected.</p>
          <p className="text-xs text-ecu-muted mt-1">Press "Load Demo" to see sample DTCs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentDtcs.map((dtc) => {
            const cfg = kindConfig[dtc.kind] || kindConfig.pending;
            return (
              <div key={dtc.code} className={`glass-card border-l-4`} style={{ borderLeftColor: cfg.color }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-base font-bold text-ecu-bright">{dtc.code}</div>
                    <div className="text-sm text-ecu-muted mt-0.5">{dtc.description}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Send Report */}
      <div className="glass-card flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-ecu-bright">Error Report</div>
          <div className="text-xs text-ecu-muted">Send diagnostic report to your mechanic</div>
        </div>
        <button className="btn-primary text-sm" onClick={sendReport}>
          📤 Send Report
        </button>
      </div>

      {/* Event Log */}
      {log.length > 0 && (
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-ecu-bright mb-2">Activity Log</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {log.map((entry, i) => (
              <div key={i} className="flex gap-2 text-xs text-ecu-muted">
                <span className="text-ecu-border">{entry.time}</span>
                <span>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
