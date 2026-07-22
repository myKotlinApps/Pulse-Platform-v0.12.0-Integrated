import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { CommandGuard, createTransport } from '../services/obd';
import { getPlatform } from '../services/platform';

export default function ScannerPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const commandGroups = useAppStore((s) => s.commandGroups);
  const commandPolicy = useAppStore((s) => s.commandPolicy);
  const [tab, setTab] = useState('connection');
  const [input, setInput] = useState('');
  const [log, setLog] = useState([{ id: 'hello', type: 'sys', text: 'ECU Pulse ELM327 Console آماده است.' }]);
  const [connected, setConnected] = useState(false);
  const [connectionLabel, setConnectionLabel] = useState('قطع');
  const [baudRate, setBaudRate] = useState(38400);
  const [extendedRead, setExtendedRead] = useState(false);
  const transportRef = useRef(null);
  const terminalRef = useRef(null);
  const platform = getPlatform();

  useEffect(() => { setActivePage('scanner'); }, [setActivePage]);
  useEffect(() => { if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight; }, [log]);

  const allCommands = useMemo(() => commandGroups.flatMap((g) => g.commands.map((c) => ({ ...c, group: g.titleFa }))), [commandGroups]);

  const addLine = (type, text) => setLog((prev) => [...prev.slice(-800), { id: `${Date.now()}-${Math.random()}`, type, text, time: new Date().toLocaleTimeString('fa-IR') }]);

  const connect = async (mock = false) => {
    try {
      addLine('sys', mock ? 'اتصال آزمایشی ELM327 فعال می‌شود…' : 'در حال انتخاب پورت ELM327…');
      const transport = createTransport({ mock, baudRate, logger: (type, text) => addLine(type.toLowerCase(), text) });
      await transport.connect();
      transportRef.current = transport;
      setConnected(true);
      setConnectionLabel(mock ? 'شبیه‌ساز' : 'متصل');
      addLine('rx', mock ? 'ELM327 v2.1 Mock >' : 'پورت سریال باز شد.');
    } catch (error) {
      addLine('sys', `خطا: ${error.message}`);
      setConnected(false);
      setConnectionLabel('خطا');
    }
  };

  const disconnect = async () => {
    try { await transportRef.current?.disconnect(); } catch {}
    transportRef.current = null;
    setConnected(false);
    setConnectionLabel('قطع');
    addLine('sys', 'ارتباط قطع شد.');
  };

  const sendCommand = async (cmd) => {
    const raw = String(cmd || input).trim().toUpperCase();
    if (!raw) return;
    if (!connected || !transportRef.current) {
      addLine('sys', 'ابتدا به ELM327 متصل شو.');
      return;
    }
    if (!CommandGuard.isAllowed(raw, commandPolicy, extendedRead)) {
      addLine('sys', `BLOCKED: ${raw} — حفاظت نوشتن فعال است.`);
      return;
    }
    try {
      addLine('tx', raw);
      const response = await transportRef.current.transact(raw, 6000);
      addLine('rx', response.replace(/\r/g, '\n'));
    } catch (error) {
      addLine('sys', `ERR: ${error.message}`);
    }
    setInput('');
  };

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <small className="text-ecu-muted text-xs">ELM327 COMMAND & BUS CENTER</small>
          <h2 className="text-lg font-bold text-ecu-bright">اسکنر، کنسول و شنود ECU</h2>
        </div>
        <span className={`scanner-pill ${connected ? 'online' : 'idle'}`}>{connectionLabel}</span>
      </div>

      <nav className="scanner-tabs">
        {[
          ['connection', 'اتصال ELM327'],
          ['console', 'کنسول ECU'],
          ['monitor', 'شنود Bus'],
          ['logs', 'فایل‌های لاگ'],
        ].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>

      {tab === 'connection' && (
        <section className="grid md:grid-cols-2 gap-4">
          <article className="glass-card space-y-4">
            <div><small className="text-ecu-muted">WEB SERIAL</small><h3 className="font-bold">اتصال مستقیم دانگل</h3></div>
            <p className="text-sm text-ecu-muted leading-7">در وب، Bluetooth کلاسیک باید در ویندوز Pair شود و در Chrome یا Edge به‌صورت پورت سریال انتخاب شود. در موبایل، همین interface به adapter native وصل می‌شود.</p>
            <label className="text-xs text-ecu-muted grid gap-2">Baud rate
              <select className="field" value={baudRate} onChange={(e) => setBaudRate(Number(e.target.value))}><option>38400</option><option>9600</option><option>115200</option></select>
            </label>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-primary" disabled={!platform.supportsWebSerial && !platform.isCapacitor} onClick={() => connect(false)}>انتخاب پورت و اتصال</button>
              <button className="btn-ghost" onClick={() => connect(true)}>اتصال آزمایشی</button>
              <button className="btn-ghost" disabled={!connected} onClick={disconnect}>قطع</button>
            </div>
          </article>
          <article className="glass-card space-y-3">
            <h3 className="font-bold">وضعیت پلتفرم</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-ecu-muted">Web Serial</span><strong>{platform.supportsWebSerial ? 'فعال' : 'غیرفعال'}</strong></div>
              <div className="flex justify-between"><span className="text-ecu-muted">Capacitor</span><strong>{platform.isCapacitor ? 'فعال' : 'وب'}</strong></div>
              <div className="flex justify-between"><span className="text-ecu-muted">Target</span><strong>{platform.isAndroid ? 'Android' : platform.isIOS ? 'iOS' : 'Desktop/Web'}</strong></div>
            </div>
          </article>
        </section>
      )}

      {tab === 'console' && (
        <>
          <div ref={terminalRef} className="terminal-box">
            {log.map((line) => <div key={line.id} className={`line ${line.type}`}><span>{line.time}</span><code>{line.type === 'tx' ? 'TX → ' : line.type === 'rx' ? 'RX ← ' : ''}{line.text}</code></div>)}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); sendCommand(input); }} className="glass-card flex gap-2">
            <input className="field font-mono" value={input} onChange={(e) => setInput(e.target.value)} placeholder="دستور OBD/AT مثل 010C" />
            <button className="btn-primary" type="submit">ارسال</button>
          </form>
          <label className="flex items-center gap-2 text-xs text-ecu-muted"><input type="checkbox" checked={extendedRead} onChange={(e) => setExtendedRead(e.target.checked)} /> خواندن پیشرفته Mode 19/22 فعال شود</label>
        </>
      )}

      {tab === 'monitor' && <div className="glass-card text-sm text-ecu-muted leading-7">شنود Bus با ATMA در adapter مشترک آماده شده است. در وب هنگام شنود، polling و کنسول باید قفل شوند؛ در موبایل همین بخش به transport native وصل می‌شود.</div>}

      {tab === 'logs' && (
        <div className="glass-card space-y-3">
          <div className="flex justify-between text-sm"><span className="text-ecu-muted">رکوردها</span><strong>{log.length.toLocaleString('fa-IR')}</strong></div>
          <button className="btn-ghost w-full" onClick={() => setLog([])}>پاک‌کردن لاگ محلی</button>
        </div>
      )}

      <section className="glass-card">
        <h3 className="text-sm font-semibold text-ecu-bright mb-3">دستورات سریع</h3>
        <div className="grid gap-3">
          {commandGroups.map((group) => (
            <div key={group.id}>
              <h4 className="text-xs text-ecu-muted mb-2">{group.titleFa}</h4>
              <div className="flex flex-wrap gap-2">
                {group.commands.map((qc) => <button key={`${group.id}-${qc.command}`} className="quick-command" onClick={() => sendCommand(qc.command)}><small>{qc.command}</small>{qc.labelFa}</button>)}
              </div>
            </div>
          ))}
          {!allCommands.length && <p className="text-sm text-ecu-muted">کاتالوگ دستورها هنوز بارگذاری نشده است.</p>}
        </div>
      </section>
    </div>
  );
}
