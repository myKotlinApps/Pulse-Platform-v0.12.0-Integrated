'use strict';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

if (!document.querySelector('[data-page="scanner"]')) {
  console.warn('ECU Console page is not present.');
} else {
  class CommandGuard {
    static normalize(value) {
      return String(value || '').toUpperCase().replace(/\s+/g, '').replace(/[\r\n]/g, '');
    }
    static isAllowed(value, extended = false) {
      const command = this.normalize(value);
      if (!command) return false;
      if (command.startsWith('AT')) {
        return !/^(ATPP|ATCV|ATSD|AT@3|ATWM|ATBI|ATFI|ATSI)/.test(command);
      }
      if (/^(04|08|10|11|14|27|28|2E|2F|31|34|35|36|37|3D|85)/.test(command)) return false;
      if (/^(01|02|03|06|07|09|0A)[0-9A-F]*$/.test(command)) return true;
      return extended && /^(19|1A|21|22)[0-9A-F]+$/.test(command);
    }
  }

  class SessionLogger {
    constructor() {
      this.entries = [];
      this.writer = null;
      this.fileName = '';
      this.writeChain = Promise.resolve();
      this.maxEntries = 200000;
      this.lineBuffers = { RX: '', MON: '' };
      this.render();
    }
    record(direction, data, meta = {}) {
      const entry = { ts: new Date().toISOString(), direction, data: String(data), ...meta };
      this.entries.push(entry);
      if (this.entries.length > this.maxEntries) this.entries.splice(0, this.entries.length - this.maxEntries);
      const line = JSON.stringify(entry) + '\n';
      if (this.writer) {
        this.writeChain = this.writeChain.then(() => this.writer.write(line)).catch(error => {
          this.writer = null;
          this.fileName = '';
          this.render();
          scannerToast(`ثبت فایل متوقف شد: ${error.message}`);
        });
      }
      appendLog('#ecuRawLog', `${entry.ts} [${direction}] ${entry.data}`, 1600);
      this.render();
      return entry;
    }
    raw(direction, chunk) {
      let buffer = (this.lineBuffers[direction] || '') + String(chunk || '').replace(/\0/g, '');
      let start = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const char = buffer[i];
        if (char === '\r' || char === '\n' || char === '>') {
          const part = buffer.slice(start, i).trim();
          if (part) this.record(direction, part);
          if (char === '>') this.record(direction, '>');
          while (i + 1 < buffer.length && /[\r\n]/.test(buffer[i + 1])) i += 1;
          start = i + 1;
        }
      }
      this.lineBuffers[direction] = buffer.slice(start);
    }
    async chooseFile() {
      if (!window.showSaveFilePicker) {
        scannerToast('مرورگر ثبت مستقیم فایل ندارد؛ خروجی JSONL را دانلود کن.');
        return;
      }
      const handle = await window.showSaveFilePicker({
        suggestedName: `ecu-pulse-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`,
        types: [{ description: 'ECU Pulse JSONL', accept: { 'application/x-ndjson': ['.jsonl'] } }]
      });
      this.writer = await handle.createWritable();
      this.fileName = handle.name;
      await this.writer.write(JSON.stringify({ ts: new Date().toISOString(), direction: 'SYS', data: 'SESSION_START', format: 'ECU_PULSE_JSONL_V1' }) + '\n');
      this.render();
      scannerToast('ثبت مستقیم روی فایل شروع شد.');
    }
    async closeFile() {
      if (!this.writer) return;
      await this.writeChain;
      await this.writer.close();
      this.writer = null;
      this.fileName = '';
      this.render();
    }
    download(format) {
      if (!this.entries.length) return scannerToast('هنوز رکوردی ثبت نشده است.');
      let content;
      let type;
      let fileName;
      if (format === 'csv') {
        const quote = value => `"${String(value).replace(/"/g, '""')}"`;
        content = 'timestamp,direction,data\n' + this.entries.map(e => [quote(e.ts), quote(e.direction), quote(e.data)].join(',')).join('\n');
        type = 'text/csv;charset=utf-8';
        fileName = 'ecu-pulse-session.csv';
      } else {
        content = this.entries.map(e => JSON.stringify(e)).join('\n') + '\n';
        type = 'application/x-ndjson';
        fileName = 'ecu-pulse-session.jsonl';
      }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([content], { type }));
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
    clear() {
      this.entries = [];
      $('#ecuRawLog').textContent = '';
      this.render();
    }
    render() {
      $('#ecuLogCount').textContent = `${this.entries.length.toLocaleString('fa-IR')} رکورد`;
      $('#ecuActiveLogFile').textContent = this.fileName || 'ندارد';
      $('#ecuCloseLogFile').disabled = !this.writer;
    }
  }

  class WebSerialTransport {
    constructor(baudRate, logger) {
      this.baudRate = baudRate;
      this.logger = logger;
      this.port = null;
      this.reader = null;
      this.writer = null;
      this.pending = null;
      this.monitoring = false;
      this.monitorCallback = null;
      this.monitorBuffer = '';
      this.closed = false;
      this.readTask = null;
      this.decoder = new TextDecoder();
    }
    async connect() {
      if (!('serial' in navigator)) throw new Error('Web Serial فقط در Chrome یا Edge دسکتاپ پشتیبانی می‌شود.');
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: this.baudRate });
      this.reader = this.port.readable.getReader();
      this.writer = this.port.writable.getWriter();
      this.closed = false;
      this.readTask = this.readLoop();
    }
    async readLoop() {
      try {
        while (!this.closed) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (!value) continue;
          const text = this.decoder.decode(value, { stream: true }).replace(/\0/g, '');
          this.logger.raw(this.monitoring ? 'MON' : 'RX', text);
          if (this.monitoring) {
            this.monitorBuffer += text;
            const lines = this.monitorBuffer.split(/\r\n|\r|\n/);
            this.monitorBuffer = lines.pop() || '';
            for (const line of lines) {
              const clean = line.replace(/>/g, '').trim();
              if (clean) this.monitorCallback?.(clean);
            }
          } else if (this.pending) {
            this.pending.buffer += text;
            if (this.pending.buffer.includes('>')) {
              const pending = this.pending;
              this.pending = null;
              clearTimeout(pending.timer);
              pending.resolve(pending.buffer);
            }
          }
        }
      } catch (error) {
        if (!this.closed) {
          this.pending?.reject(error);
          this.pending = null;
          setConnectionState('error', 'ارتباط قطع شد');
          this.logger.record('SYS', `SERIAL_READ_ERROR: ${error.message}`);
        }
      }
    }
    async writeRaw(text, direction = 'TX') {
      if (!this.writer) throw new Error('پورت باز نیست.');
      this.logger.record(direction, text.replace(/\r/g, '<CR>'));
      await this.writer.write(new TextEncoder().encode(text));
    }
    async transact(command, timeoutMs = 6000) {
      if (this.monitoring) throw new Error('ابتدا شنود Bus را متوقف کن.');
      if (this.pending) throw new Error('فرمان قبلی هنوز در حال اجراست.');
      return new Promise(async (resolve, reject) => {
        const pending = { buffer: '', resolve, reject, timer: null };
        pending.timer = setTimeout(() => {
          if (this.pending === pending) this.pending = null;
          reject(new Error(`Timeout ${timeoutMs}ms waiting for ELM327 prompt`));
        }, timeoutMs);
        this.pending = pending;
        try {
          await this.writeRaw(`${command.trim()}\r`);
        } catch (error) {
          clearTimeout(pending.timer);
          this.pending = null;
          reject(error);
        }
      });
    }
    async startMonitor(command, callback) {
      if (this.pending) throw new Error('فرمان قبلی هنوز تمام نشده است.');
      this.monitoring = true;
      this.monitorCallback = callback;
      this.monitorBuffer = '';
      await this.writeRaw(`${command.trim()}\r`);
    }
    async stopMonitor() {
      if (!this.monitoring) return;
      await this.writeRaw('\r', 'TX');
      this.monitoring = false;
      this.monitorCallback = null;
      await sleep(180);
    }
    async close() {
      this.closed = true;
      if (this.monitoring) await this.stopMonitor().catch(() => {});
      try { await this.reader?.cancel(); } catch {}
      try { this.reader?.releaseLock(); } catch {}
      try { this.writer?.releaseLock(); } catch {}
      try { await this.port?.close(); } catch {}
      this.reader = null;
      this.writer = null;
      this.port = null;
    }
  }

  class MockTransport {
    constructor(logger) {
      this.logger = logger;
      this.monitorTimer = null;
      this.tick = 0;
    }
    async connect() { await sleep(100); this.logger.record('SYS', 'MOCK_CONNECTED'); }
    response(command) {
      const c = command.toUpperCase().replace(/\s+/g, '');
      this.tick += 1;
      const rpm = 800 + (this.tick % 24) * 75;
      const rawRpm = Math.round(rpm * 4);
      const speed = 18 + (this.tick % 62);
      const responses = {
        ATZ: 'ELM327 v1.5', ATI: 'ECU Pulse Mock ELM327 v1.5', ATRV: '13.8V',
        ATDP: 'ISO 15765-4 (CAN 11/500)', ATDPN: 'A6', '0100': '41 00 BE 3F A8 13',
        '010C': `41 0C ${(rawRpm >> 8).toString(16).padStart(2, '0')} ${(rawRpm & 255).toString(16).padStart(2, '0')}`.toUpperCase(),
        '010D': `41 0D ${speed.toString(16).padStart(2, '0')}`.toUpperCase(), '0105': '41 05 7B',
        '0104': '41 04 66', '03': '43 01 33 04 20 00 00', '07': '47 04 20 00 00', '0A': '4A 00 00',
        '0902': '49 02 01 44 45 4D 4F 45 43 55 50\r49 02 02 55 4C 53 45 30 30 30 31'
      };
      return responses[c] || 'OK';
    }
    async transact(command) {
      this.logger.record('TX', command);
      await sleep(70);
      const response = `${this.response(command)}\r>`;
      this.logger.raw('RX', response);
      return response;
    }
    async startMonitor(command, callback) {
      this.logger.record('TX', command);
      this.monitorTimer = setInterval(() => {
        const id = ['7E8', '7E9', '7E0'][this.tick % 3];
        const line = `${id} 08 04 41 0C ${((this.tick * 3) & 255).toString(16).padStart(2, '0')} ${(this.tick & 255).toString(16).padStart(2, '0')} 00 00` .toUpperCase();
        this.tick += 1;
        this.logger.raw('MON', `${line}\r`);
        callback(line);
      }, 160);
    }
    async stopMonitor() { clearInterval(this.monitorTimer); this.monitorTimer = null; this.logger.record('TX', '<CR>'); }
    async close() { await this.stopMonitor(); this.logger.record('SYS', 'MOCK_DISCONNECTED'); }
  }

  const logger = new SessionLogger();
  const consoleState = {
    transport: null,
    connected: false,
    busy: false,
    monitoring: false,
    profiles: [],
    commands: [],
    frames: 0,
    bytes: 0,
    frameTimes: []
  };

  function scannerToast(message) {
    const toast = $('#toast');
    if (!toast) return console.info(message);
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast.ecuTimer);
    toast.ecuTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function appendLog(selector, text, maxLines = 1200) {
    const node = $(selector);
    if (!node) return;
    node.textContent += `${text}\n`;
    const lines = node.textContent.split('\n');
    if (lines.length > maxLines) node.textContent = lines.slice(-maxLines).join('\n');
    node.scrollTop = node.scrollHeight;
  }

  function setConnectionState(kind, text) {
    const pill = $('#scannerConnectionPill');
    pill.className = `scanner-pill ${kind}`;
    pill.textContent = text;
    const myDiag = $('#mydiagConnectionState');
    if (myDiag) myDiag.textContent = consoleState.connected ? `ELM327: ${text}` : 'اتصال شبیه‌ساز آماده است';
  }

  function lockUi() {
    const connected = consoleState.connected;
    const locked = consoleState.busy || consoleState.monitoring;
    $('#ecuDisconnect').disabled = !connected;
    $('#ecuInitialize').disabled = !connected || locked;
    $('#ecuCommandInput').disabled = !connected || locked;
    $('#ecuSendCommand').disabled = !connected || locked;
    $('#ecuApplyFilter').disabled = !connected || locked;
    $('#ecuStartMonitor').disabled = !connected || locked;
    $('#ecuStopMonitor').disabled = !consoleState.monitoring;
    $$('#ecuQuickCommands button').forEach(button => { button.disabled = !connected || locked; });
  }

  async function loadCatalogs() {
    const [profiles, commands] = await Promise.all([
      fetch('data/elm327-protocol-profiles.json').then(r => r.json()),
      fetch('data/ecu-console-commands.json').then(r => r.json())
    ]);
    consoleState.profiles = profiles.profiles || [];
    consoleState.commands = commands.groups || [];
    $('#ecuProfile').innerHTML = consoleState.profiles.map((profile, index) => `<option value="${index}">${profile.nameFa} · ${profile.protocol}</option>`).join('');
    $('#ecuQuickCommands').innerHTML = consoleState.commands.map(group => `<section><h3>${group.titleFa}</h3><div>${group.commands.map(item => `<button data-ecu-command="${item.command}" title="${item.command}">${item.labelFa}<small>${item.command}</small></button>`).join('')}</div></section>`).join('');
    $$('[data-ecu-command]').forEach(button => button.addEventListener('click', () => sendCommand(button.dataset.ecuCommand)));
    renderInitSteps([]);
    lockUi();
  }

  function renderInitSteps(statuses) {
    const profile = consoleState.profiles[Number($('#ecuProfile').value || 0)];
    const commands = ['ATZ', 'ATE0', 'ATL0', 'ATS0', 'ATH1', 'ATAT1', 'ATST96', 'ATI', 'ATRV', ...(profile?.commands || ['ATSP0']), '0100', 'ATDP', 'ATDPN'];
    $('#ecuInitSteps').innerHTML = commands.map(command => {
      const status = statuses.find(item => item.command === command);
      return `<div class="${status?.state || ''}"><code>${command}</code><span>${status?.message || 'در انتظار'}</span></div>`;
    }).join('');
  }

  async function connectTransport(mock = false) {
    if (consoleState.connected) await disconnectTransport();
    try {
      setConnectionState('busy', 'در حال اتصال');
      const transport = mock ? new MockTransport(logger) : new WebSerialTransport(Number($('#ecuBaud').value), logger);
      await transport.connect();
      consoleState.transport = transport;
      consoleState.connected = true;
      logger.record('SYS', mock ? 'CONNECTED_MOCK' : 'CONNECTED_WEB_SERIAL');
      setConnectionState('online', mock ? 'Mock ELM327' : 'پورت سریال متصل');
      appendLog('#ecuConnectionLog', mock ? 'Mock ELM327 متصل شد.' : 'پورت سریال انتخاب و باز شد.');
      lockUi();
    } catch (error) {
      consoleState.transport = null;
      consoleState.connected = false;
      setConnectionState('error', 'خطای اتصال');
      appendLog('#ecuConnectionLog', `ERROR: ${error.message}`);
      scannerToast(error.message);
      lockUi();
    }
  }

  async function disconnectTransport() {
    if (!consoleState.transport) return;
    try { await consoleState.transport.close(); } catch {}
    consoleState.transport = null;
    consoleState.connected = false;
    consoleState.monitoring = false;
    consoleState.busy = false;
    logger.record('SYS', 'DISCONNECTED');
    setConnectionState('idle', 'قطع');
    lockUi();
  }

  async function transact(command, { guard = true, timeout = 7000 } = {}) {
    if (!consoleState.transport) throw new Error('ابتدا ELM327 را متصل کن.');
    if (guard && !CommandGuard.isAllowed(command, $('#ecuExtendedRead').checked)) throw new Error(`فرمان ${command} در حالت Read-only مسدود است.`);
    consoleState.busy = true;
    lockUi();
    try {
      const response = await consoleState.transport.transact(command, timeout);
      return response;
    } finally {
      consoleState.busy = false;
      lockUi();
    }
  }

  async function initializeProfile() {
    const profile = consoleState.profiles[Number($('#ecuProfile').value || 0)];
    const commands = ['ATZ', 'ATE0', 'ATL0', 'ATS0', 'ATH1', 'ATAT1', 'ATST96', 'ATI', 'ATRV', ...(profile?.commands || ['ATSP0']), '0100', 'ATDP', 'ATDPN'];
    const statuses = [];
    renderInitSteps(statuses);
    for (const command of commands) {
      statuses.push({ command, state: 'running', message: 'در حال اجرا' });
      renderInitSteps(statuses);
      try {
        const response = await transact(command, { guard: false, timeout: command === 'ATZ' ? 12000 : 8000 });
        const clean = response.replace(/>/g, '').trim();
        statuses[statuses.length - 1] = { command, state: 'ok', message: clean.split(/[\r\n]/).filter(Boolean).at(-1) || 'OK' };
        appendLog('#ecuConnectionLog', `${command}  ←  ${clean.replace(/[\r\n]+/g, ' | ')}`);
      } catch (error) {
        statuses[statuses.length - 1] = { command, state: 'fail', message: error.message };
        renderInitSteps(statuses);
        logger.record('SYS', `INIT_FAILED ${command}: ${error.message}`);
        throw error;
      }
      renderInitSteps(statuses);
    }
    scannerToast('راه‌اندازی ELM327 کامل شد.');
  }

  async function sendCommand(command = $('#ecuCommandInput').value) {
    const normalized = CommandGuard.normalize(command);
    if (!normalized) return;
    appendLog('#ecuTerminalLog', `> ${normalized}`);
    try {
      const response = await transact(normalized);
      appendLog('#ecuTerminalLog', response.replace(/>/g, '').trim() || '(پاسخ خالی)');
      $('#ecuCommandInput').value = '';
    } catch (error) {
      appendLog('#ecuTerminalLog', `! ${error.message}`);
      scannerToast(error.message);
    }
  }

  async function applyFilter() {
    const filter = CommandGuard.normalize($('#ecuCraFilter').value);
    const command = filter ? `ATCRA${filter}` : 'ATCRA';
    const response = await transact(command, { guard: false });
    appendLog('#ecuMonitorLog', `${command}: ${response.replace(/>/g, '').trim()}`);
  }

  function onMonitorFrame(line) {
    consoleState.frames += 1;
    consoleState.bytes += line.length;
    const now = Date.now();
    consoleState.frameTimes.push(now);
    consoleState.frameTimes = consoleState.frameTimes.filter(value => now - value <= 1000);
    $('#ecuMonitorFrames').textContent = consoleState.frames.toLocaleString('fa-IR');
    $('#ecuMonitorBytes').textContent = consoleState.bytes.toLocaleString('fa-IR');
    $('#ecuMonitorRate').textContent = `${consoleState.frameTimes.length.toLocaleString('fa-IR')}/s`;
    appendLog('#ecuMonitorLog', line, 5000);
  }

  async function startMonitor() {
    if (!consoleState.transport) return;
    const command = $('#ecuMonitorCommand').value || 'ATMA';
    consoleState.frames = 0;
    consoleState.bytes = 0;
    consoleState.frameTimes = [];
    consoleState.monitoring = true;
    $('#ecuMonitorState').className = 'scanner-pill online';
    $('#ecuMonitorState').textContent = 'فعال';
    lockUi();
    logger.record('SYS', `MONITOR_START ${command}`);
    try {
      await consoleState.transport.startMonitor(command, onMonitorFrame);
    } catch (error) {
      consoleState.monitoring = false;
      $('#ecuMonitorState').className = 'scanner-pill error';
      $('#ecuMonitorState').textContent = 'خطا';
      lockUi();
      scannerToast(error.message);
    }
  }

  async function stopMonitor() {
    if (!consoleState.transport || !consoleState.monitoring) return;
    await consoleState.transport.stopMonitor();
    consoleState.monitoring = false;
    logger.record('SYS', 'MONITOR_STOP');
    $('#ecuMonitorState').className = 'scanner-pill idle';
    $('#ecuMonitorState').textContent = 'خاموش';
    lockUi();
  }

  $$('.scanner-tabs button').forEach(button => button.addEventListener('click', () => {
    $$('.scanner-tabs button').forEach(item => item.classList.toggle('active', item === button));
    $$('.scanner-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.scannerPanel === button.dataset.scannerTab));
  }));

  $('#ecuConnect').addEventListener('click', () => connectTransport(false));
  $('#ecuMockConnect').addEventListener('click', () => connectTransport(true));
  $('#ecuDisconnect').addEventListener('click', disconnectTransport);
  $('#ecuInitialize').addEventListener('click', () => initializeProfile().catch(error => scannerToast(error.message)));
  $('#ecuProfile').addEventListener('change', () => renderInitSteps([]));
  $('#ecuSendCommand').addEventListener('click', () => sendCommand());
  $('#ecuCommandInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); sendCommand(); }
  });
  $('#ecuClearTerminal').addEventListener('click', () => { $('#ecuTerminalLog').textContent = ''; });
  $('#ecuApplyFilter').addEventListener('click', () => applyFilter().catch(error => scannerToast(error.message)));
  $('#ecuStartMonitor').addEventListener('click', startMonitor);
  $('#ecuStopMonitor').addEventListener('click', () => stopMonitor().catch(error => scannerToast(error.message)));
  $('#ecuClearMonitor').addEventListener('click', () => { $('#ecuMonitorLog').textContent = ''; });
  $('#ecuChooseLogFile').addEventListener('click', () => logger.chooseFile().catch(error => scannerToast(error.message)));
  $('#ecuCloseLogFile').addEventListener('click', () => logger.closeFile().catch(error => scannerToast(error.message)));
  $('#ecuDownloadJsonl').addEventListener('click', () => logger.download('jsonl'));
  $('#ecuDownloadCsv').addEventListener('click', () => logger.download('csv'));
  $('#ecuClearLogs').addEventListener('click', () => logger.clear());
  window.addEventListener('beforeunload', () => { consoleState.transport?.close(); logger.closeFile(); });

  loadCatalogs().catch(error => {
    appendLog('#ecuConnectionLog', `خطای بارگذاری داده مشترک: ${error.message}`);
    scannerToast(error.message);
  });
  setConnectionState('idle', 'قطع');
  lockUi();
}
