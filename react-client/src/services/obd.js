
import { normalizeCommand } from './format';
import { getPlatform } from './platform';

export class CommandGuard {
  static isAllowed(value, policy = {}, extended = false) {
    const command = normalizeCommand(value);
    if (!command) return false;
    if (command.startsWith('AT')) return !/^(ATPP|ATCV|ATSD|AT@3|ATWM|ATBI|ATFI|ATSI)/.test(command);
    const blocked = policy.blockedPrefixes || ['04', '08', '10', '11', '14', '27', '28', '2E', '2F', '31', '34', '35', '36', '37', '3D', '85'];
    if (blocked.some((p) => command.startsWith(p))) return false;
    if (/^(01|02|03|06|07|09|0A)[0-9A-F]*$/.test(command)) return true;
    const advanced = policy.advancedReadPrefixes || ['19', '1A', '21', '22'];
    return extended && advanced.some((p) => command.startsWith(p));
  }
}

const MOCK_RESPONSES = {
  ATZ: 'ELM327 v2.1\r>', ATI: 'ELM327 v2.1\r>', ATE0: 'OK\r>', ATL0: 'OK\r>', ATH0: 'OK\r>', ATS0: 'OK\r>', ATSP0: 'OK\r>',
  ATDP: 'AUTO, ISO 15765-4 (CAN 11/500)\r>', ATDPN: 'A6\r>', ATRV: '13.9V\r>', '0100': '41 00 BE 3E B8 11\r>',
  '010C': '41 0C 1A F8\r>', '010D': '41 0D 2D\r>', '0105': '41 05 50\r>', '0104': '41 04 44\r>', '0111': '41 11 25\r>', '010B': '41 0B 33\r>', '03': '43 01 33 00 00\r>', '07': 'NO DATA\r>', '0902': '49 02 01 00 00 00 31\r>',
};

export class MockTransport {
  constructor(logger = null, delayMs = 120) { this.logger = logger; this.delayMs = delayMs; this.closed = false; this.kind = 'mock'; }
  async connect() { this.closed = false; return true; }
  async transact(command) {
    const normalized = normalizeCommand(command);
    this.logger?.('TX', command);
    await new Promise((r) => setTimeout(r, this.delayMs));
    const response = MOCK_RESPONSES[normalized] || 'NO DATA\r>';
    this.logger?.('RX', response.replace(/\r/g, ''));
    return response;
  }
  async disconnect() { this.closed = true; }
}

export class WebSerialTransport {
  constructor(baudRate = 38400, logger = null) { this.baudRate = baudRate; this.logger = logger; this.port = null; this.reader = null; this.writer = null; this.pending = null; this.closed = true; this.decoder = new TextDecoder(); }
  async connect() {
    if (!('serial' in navigator)) throw new Error('Web Serial فقط در Chrome یا Edge دسکتاپ پشتیبانی می‌شود.');
    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate: this.baudRate });
    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();
    this.closed = false;
    this.readLoop();
    return true;
  }
  async readLoop() {
    try {
      while (!this.closed) {
        const { value, done } = await this.reader.read();
        if (done) break;
        const text = this.decoder.decode(value, { stream: true }).replace(/\0/g, '');
        this.logger?.('RX', text);
        if (this.pending) {
          this.pending.buffer += text;
          if (this.pending.buffer.includes('>')) {
            const pending = this.pending;
            this.pending = null;
            clearTimeout(pending.timer);
            pending.resolve(pending.buffer);
          }
        }
      }
    } catch (error) { this.pending?.reject(error); this.pending = null; }
  }
  async writeRaw(text) { this.logger?.('TX', text.replace(/\r/g, '<CR>')); await this.writer.write(new TextEncoder().encode(text)); }
  async transact(command, timeoutMs = 6000) {
    if (!this.writer) throw new Error('پورت باز نیست.');
    if (this.pending) throw new Error('فرمان قبلی هنوز در حال اجراست.');
    return new Promise(async (resolve, reject) => {
      const pending = { buffer: '', resolve, reject, timer: null };
      pending.timer = setTimeout(() => { if (this.pending === pending) this.pending = null; reject(new Error(`Timeout ${timeoutMs}ms waiting for ELM327 prompt`)); }, timeoutMs);
      this.pending = pending;
      try { await this.writeRaw(`${command.trim()}\r`); } catch (error) { clearTimeout(pending.timer); this.pending = null; reject(error); }
    });
  }
  async disconnect() {
    this.closed = true;
    try { await this.reader?.cancel(); } catch {}
    try { this.reader?.releaseLock(); } catch {}
    try { await this.writer?.close(); } catch {}
    try { this.writer?.releaseLock(); } catch {}
    try { await this.port?.close(); } catch {}
    this.port = null; this.reader = null; this.writer = null;
  }
}

export function createTransport({ mock = false, baudRate = 38400, logger = null } = {}) {
  if (mock) return new MockTransport(logger);
  const platform = getPlatform();
  if (platform.supportsWebSerial) return new WebSerialTransport(baudRate, logger);
  return new MockTransport(logger);
}
