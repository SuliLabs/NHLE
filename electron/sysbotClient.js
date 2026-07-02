const net = require('net');
const { EventEmitter } = require('events');

class SysBotClient extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.connected = false;
    this.host = '';
    this.port = 6000;
    this.buffer = Buffer.alloc(0);
    this.queue = [];
  }

  _onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this._drain();
  }

  _drain() {
    while (this.queue.length > 0) {
      const item = this.queue[0];

      if (item.type === 'text') {
        const idx = this.buffer.indexOf(0x0a); // \n
        if (idx === -1) break;
        const line = this.buffer.slice(0, idx).toString().replace(/\r$/, '').trim();
        this.buffer = this.buffer.slice(idx + 1);
        this.queue.shift();
        clearTimeout(item.timer);
        if (!item.timedOut) item.resolve(line);   // late reply after a timeout → discard

      } else if (item.type === 'binary') {
        // pixelPeek: 4-byte LE size header, then JPEG bytes
        if (this.buffer.length < 4) break;
        if (!item.size) {
          item.size = this.buffer.readUInt32LE(0);
          this.buffer = this.buffer.slice(4);
        }
        if (this.buffer.length < item.size) break;
        const data = this.buffer.slice(0, item.size);
        this.buffer = this.buffer.slice(item.size);
        this.queue.shift();
        clearTimeout(item.timer);
        if (!item.timedOut) item.resolve(data);
      } else {
        break;
      }
    }
  }

  _rejectAll(err) {
    const q = [...this.queue];
    this.queue = [];
    q.forEach(item => {
      clearTimeout(item.timer);
      if (!item.timedOut) item.reject(err);
    });
  }

  connect(host, port = 6000) {
    this.disconnect();
    this.host = host;
    this.port = port;

    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      const timer = setTimeout(() => {
        this.socket.destroy();
        reject(new Error('Connection timeout after 5s'));
      }, 5000);

      this.socket.once('connect', () => {
        clearTimeout(timer);
        this.connected = true;
        resolve();
      });

      this.socket.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.socket.on('error', (err) => {
        if (this.connected) {
          this.connected = false;
          this.emit('disconnected', err.message);
          this._rejectAll(err);
        }
      });

      this.socket.on('close', () => {
        if (this.connected) {
          this.connected = false;
          this.emit('disconnected', 'Connection closed');
        }
      });

      this.socket.on('data', (chunk) => this._onData(chunk));
      this.socket.connect(port, host);
    });
  }

  _cmd(command, type) {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.socket) {
        return reject(new Error('Not connected to Switch'));
      }

      // Fire-and-forget commands (poke, click, …) have no reply to wait for.
      if (!type) {
        this.socket.write(command + '\r\n', (err) => (err ? reject(err) : resolve(null)));
        return;
      }

      const item = { type, resolve, reject, timedOut: false, timer: null };
      item.timer = setTimeout(() => {
        // Keep the item queued: its reply may still arrive and must be
        // consumed (discarded) so later replies stay matched to their command.
        item.timedOut = true;
        reject(new Error(`Timeout: ${command.split(' ')[0]}`));
      }, 8000);
      this.queue.push(item);

      this.socket.write(command + '\r\n', (err) => {
        if (err) {
          clearTimeout(item.timer);
          const idx = this.queue.indexOf(item);
          if (idx !== -1) this.queue.splice(idx, 1);
          reject(err);
        }
      });
    });
  }

  // ── Memory read ──────────────────────────────────────────────────────────
  peek(address, size)         { return this._cmd(`peek ${address} ${size}`, 'text'); }
  peekAbsolute(address, size) { return this._cmd(`peekAbsolute ${address} ${size}`, 'text'); }
  peekMain(address, size)     { return this._cmd(`peekMain ${address} ${size}`, 'text'); }

  pointerPeek(size, ...chain) { return this._cmd(`pointerPeek ${size} ${chain.join(' ')}`, 'text'); }
  pointer(...chain)           { return this._cmd(`pointer ${chain.join(' ')}`, 'text'); }
  pointerAll(...chain)        { return this._cmd(`pointerAll ${chain.join(' ')}`, 'text'); }

  // ── Memory write ─────────────────────────────────────────────────────────
  poke(address, value)        { return this._cmd(`poke ${address} ${value}`, null); }
  pokeAbsolute(address, value){ return this._cmd(`pokeAbsolute ${address} ${value}`, null); }
  pokeMain(address, value)    { return this._cmd(`pokeMain ${address} ${value}`, null); }
  pointerPoke(value, ...chain){ return this._cmd(`pointerPoke ${value} ${chain.join(' ')}`, null); }

  // ── Freeze ────────────────────────────────────────────────────────────────
  freeze(address, value)      { return this._cmd(`freeze ${address} ${value}`, null); }
  unFreeze(address)           { return this._cmd(`unFreeze ${address}`, null); }
  freezeClear()               { return this._cmd('freezeClear', null); }
  freezeCount()               { return this._cmd('freezeCount', 'text'); }
  freezePause()               { return this._cmd('freezePause', null); }
  freezeUnpause()             { return this._cmd('freezeUnpause', null); }

  // ── Controller ───────────────────────────────────────────────────────────
  click(button)               { return this._cmd(`click ${button}`, null); }
  press(button)               { return this._cmd(`press ${button}`, null); }
  release(button)             { return this._cmd(`release ${button}`, null); }
  clickSeq(seq)               { return this._cmd(`clickSeq ${seq}`, null); }
  setStick(side, x, y)       { return this._cmd(`setStick ${side} ${x} ${y}`, null); }
  clickCancel()               { return this._cmd('clickCancel', null); }
  detachController()          { return this._cmd('detachController', null); }

  // ── Screen ───────────────────────────────────────────────────────────────
  pixelPeek()                 { return this._cmd('pixelPeek', 'binary'); }
  screenOn()                  { return this._cmd('screenOn', null); }
  screenOff()                 { return this._cmd('screenOff', null); }

  // ── Utility ──────────────────────────────────────────────────────────────
  getTitleID()                { return this._cmd('getTitleID', 'text'); }
  getTitleVersion()           { return this._cmd('getTitleVersion', 'text'); }
  getSystemLanguage()         { return this._cmd('getSystemLanguage', 'text'); }
  getBuildID()                { return this._cmd('getBuildID', 'text'); }
  getHeapBase()               { return this._cmd('getHeapBase', 'text'); }
  getMainNsoBase()            { return this._cmd('getMainNsoBase', 'text'); }
  getVersion()                { return this._cmd('getVersion', 'text'); }
  charge()                    { return this._cmd('charge', 'text'); }
  game(info)                  { return this._cmd(`game ${info}`, 'text'); }
  configure(key, value)       { return this._cmd(`configure ${key} ${value}`, null); }

  // ── Raw command ──────────────────────────────────────────────────────────
  raw(command) {
    const TEXT_CMDS = new Set([
      'peek','peekAbsolute','peekMain','peekMulti','peekAbsoluteMulti','peekMainMulti',
      'pointer','pointerAll','pointerRelative','pointerPeek','pointerPeekMulti',
      'getTitleID','getTitleVersion','getBuildID','getHeapBase','getMainNsoBase',
      'getSystemLanguage','getVersion','charge','game','isProgramRunning','freezeCount',
    ]);
    const BINARY_CMDS = new Set(['pixelPeek']);
    const cmd = command.trim().split(/\s+/)[0];
    const type = BINARY_CMDS.has(cmd) ? 'binary' : TEXT_CMDS.has(cmd) ? 'text' : null;
    return this._cmd(command.trim(), type);
  }

  disconnect() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.connected = false;
    this.buffer = Buffer.alloc(0);
    this._rejectAll(new Error('Disconnected'));
  }
}

module.exports = new SysBotClient();
