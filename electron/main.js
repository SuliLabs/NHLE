const { app, BrowserWindow, ipcMain, shell, protocol } = require('electron');
let mainWindow = null;
const path = require('path');
const fs = require('fs');
const yauzl = require('yauzl');
const client = require('./sysbotClient');

const isDev = !!process.env.ELECTRON_START_URL;

// Item icons load via a custom "spr://" scheme so they work from both the dev
// http://localhost origin and the packaged file:// origin (a plain file:// <img>
// is blocked by web security when the page is served over http). Must be
// registered as privileged BEFORE the app is ready.
protocol.registerSchemesAsPrivileged([
  { scheme: 'spr', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true } },
]);

function appIcon() {
  return isDev
    ? path.join(__dirname, '..', 'build', 'icon.png')
    : path.join(process.resourcesPath || __dirname, 'icon.png');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'NHLE — New Horizons Live Editor',
    icon: appIcon(),
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'win32',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow = win;

  if (isDev) {
    win.loadURL(process.env.ELECTRON_START_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  // spr://img/<Name>.png  →  <userData>/SPR/img/<Name>.png
  protocol.handle('spr', async (request) => {
    try {
      const u = new URL(request.url);
      const rel = decodeURIComponent((u.hostname + u.pathname).replace(/^\/+/, ''));
      const root = spritesRoot();
      const filePath = path.normalize(path.join(root, rel));
      if (!filePath.startsWith(root)) return new Response('', { status: 403 });
      const data = await fs.promises.readFile(filePath);
      return new Response(data, { headers: { 'Content-Type': 'image/png' } });
    } catch {
      return new Response('', { status: 404 });
    }
  });
  createWindow();
});

// Forward client disconnect events to the renderer. Registered once, globally,
// so recreating the window (macOS activate) doesn't stack duplicate listeners.
client.on('disconnected', (reason) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sysbot:event', { type: 'disconnected', reason });
  }
});

app.on('window-all-closed', () => {
  client.disconnect();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── IPC Handlers ─────────────────────────────────────────────────────────────

function wrap(fn) {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return { ok: true, data: result };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };
}

// Window controls
ipcMain.handle('app:minimize', () => { mainWindow?.minimize(); return { ok: true }; });
ipcMain.handle('app:quit',     () => { client.disconnect(); app.quit(); return { ok: true }; });

// Item database CSVs. Served over IPC because the packaged app runs from a
// file:// origin where fetch() cannot load local files (dev works over http).
ipcMain.handle('app:readData', (_, name) => {
  try {
    const safe = path.basename(String(name));            // no traversal
    const dir = isDev
      ? path.join(__dirname, '..', 'public', 'data')
      : path.join(__dirname, '..', 'dist', 'data');      // inside app.asar
    return { ok: true, data: fs.readFileSync(path.join(dir, safe), 'utf8') };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── Sprites (SPR.zip → userData/SPR) ─────────────────────────────────────────
// The bundled SPR.zip holds img/<InternalName>.png for every item. It is shipped
// inside the release and, on the user's first "yes", unpacked once into the
// per-user data dir so icons load from disk (no network).
function spritesRoot() { return path.join(app.getPath('userData'), 'SPR'); }
function spritesMarker() { return path.join(spritesRoot(), '.extracted'); }
function bundledZipPath() {
  const candidates = [
    path.join(__dirname, '..', 'public', 'SPR.zip'),  // dev
    path.join(process.resourcesPath || '', 'SPR.zip'), // packaged (extraResources)
    path.join(__dirname, '..', 'dist', 'SPR.zip'),
  ];
  for (const c of candidates) { try { if (fs.existsSync(c)) return c; } catch {} }
  return null;
}

ipcMain.handle('sprites:status', () => ({
  ok: true,
  data: {
    extracted: fs.existsSync(spritesMarker()),
    dir: spritesRoot(),
    hasZip: !!bundledZipPath(),
  },
}));
ipcMain.handle('sprites:dir', () => ({ ok: true, data: spritesRoot() }));

// Index of every available sprite basename (without ".png"), so the renderer can
// resolve the right filename (plain / _Remake_b_p / variation suffix) in one shot
// instead of probing the disk with 404s.
ipcMain.handle('sprites:names', () => {
  try {
    const dir = path.join(spritesRoot(), 'img');
    const names = fs.readdirSync(dir)
      .filter(f => f.endsWith('.png'))
      .map(f => f.slice(0, -4));
    return { ok: true, data: names };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('sprites:extract', (evt) => new Promise((resolve) => {
  // Already unpacked → succeed instantly.
  if (fs.existsSync(spritesMarker())) {
    return resolve({ ok: true, data: { dir: spritesRoot(), total: 0, skipped: true } });
  }
  const zipPath = bundledZipPath();
  if (!zipPath) return resolve({ ok: false, error: 'SPR.zip not found' });

  const outRoot = spritesRoot();
  try { fs.mkdirSync(outRoot, { recursive: true }); } catch (e) { return resolve({ ok: false, error: e.message }); }

  yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
    if (err) return resolve({ ok: false, error: err.message });
    const total = zip.entryCount;
    let done = 0, lastSent = 0;
    const send = () => {
      const now = Date.now();
      if (now - lastSent > 80 || done >= total) {
        lastSent = now;
        try { evt.sender.send('sprites:progress', { done, total }); } catch {}
      }
    };
    zip.on('entry', (entry) => {
      const safe = entry.fileName.replace(/\\/g, '/');
      if (safe.split('/').includes('..')) { done++; send(); zip.readEntry(); return; }  // traversal guard
      const outPath = path.join(outRoot, safe);
      if (/\/$/.test(safe)) { try { fs.mkdirSync(outPath, { recursive: true }); } catch {} done++; zip.readEntry(); return; }
      try { fs.mkdirSync(path.dirname(outPath), { recursive: true }); } catch {}
      zip.openReadStream(entry, (e2, rs) => {
        if (e2) { zip.close(); return resolve({ ok: false, error: e2.message }); }
        const ws = fs.createWriteStream(outPath);
        ws.on('error', (e3) => { zip.close(); resolve({ ok: false, error: e3.message }); });
        ws.on('close', () => { done++; send(); zip.readEntry(); });
        rs.pipe(ws);
      });
    });
    zip.on('end', () => {
      try { fs.writeFileSync(spritesMarker(), String(Date.now())); } catch {}
      try { evt.sender.send('sprites:progress', { done: total, total }); } catch {}
      resolve({ ok: true, data: { dir: outRoot, total } });
    });
    zip.on('error', (e) => resolve({ ok: false, error: e.message }));
    zip.readEntry();
  });
}));

// Connection
ipcMain.handle('sysbot:connect', (_, host, port) =>
  wrap(() => client.connect(host, Number(port) || 6000))()
);
ipcMain.handle('sysbot:disconnect', () => {
  client.disconnect();
  return { ok: true };
});
ipcMain.handle('sysbot:status', () => ({
  ok: true,
  data: { connected: client.connected, host: client.host, port: client.port },
}));

// Memory read
ipcMain.handle('sysbot:peek',         (_, addr, size) => wrap(() => client.peek(addr, size))());
ipcMain.handle('sysbot:peekAbsolute', (_, addr, size) => wrap(() => client.peekAbsolute(addr, size))());
ipcMain.handle('sysbot:peekMain',     (_, addr, size) => wrap(() => client.peekMain(addr, size))());

// Memory write
ipcMain.handle('sysbot:poke',         (_, addr, val) => wrap(() => client.poke(addr, val))());
ipcMain.handle('sysbot:pokeAbsolute', (_, addr, val) => wrap(() => client.pokeAbsolute(addr, val))());
ipcMain.handle('sysbot:pokeMain',     (_, addr, val) => wrap(() => client.pokeMain(addr, val))());

// Pointer
ipcMain.handle('sysbot:pointer',     (_, chain) => wrap(() => client.pointer(...chain))());
ipcMain.handle('sysbot:pointerPeek', (_, size, chain) => wrap(() => client.pointerPeek(size, ...chain))());

// Freeze
ipcMain.handle('sysbot:freeze',       (_, addr, val) => wrap(() => client.freeze(addr, val))());
ipcMain.handle('sysbot:unFreeze',     (_, addr) => wrap(() => client.unFreeze(addr))());
ipcMain.handle('sysbot:freezeClear',  () => wrap(() => client.freezeClear())());
ipcMain.handle('sysbot:freezeCount',  () => wrap(() => client.freezeCount())());
ipcMain.handle('sysbot:freezePause',  () => wrap(() => client.freezePause())());
ipcMain.handle('sysbot:freezeUnpause',() => wrap(() => client.freezeUnpause())());

// Controller
ipcMain.handle('sysbot:click',    (_, btn) => wrap(() => client.click(btn))());
ipcMain.handle('sysbot:press',    (_, btn) => wrap(() => client.press(btn))());
ipcMain.handle('sysbot:release',  (_, btn) => wrap(() => client.release(btn))());
ipcMain.handle('sysbot:clickSeq', (_, seq) => wrap(() => client.clickSeq(seq))());
ipcMain.handle('sysbot:setStick', (_, side, x, y) => wrap(() => client.setStick(side, x, y))());

// Screen
ipcMain.handle('sysbot:pixelPeek', () =>
  wrap(async () => {
    const buf = await client.pixelPeek();
    return buf.toString('base64');
  })()
);
ipcMain.handle('sysbot:screenOn',  () => wrap(() => client.screenOn())());
ipcMain.handle('sysbot:screenOff', () => wrap(() => client.screenOff())());

// Info
ipcMain.handle('sysbot:getTitleID',       () => wrap(() => client.getTitleID())());
ipcMain.handle('sysbot:getTitleVersion',  () => wrap(() => client.getTitleVersion())());
ipcMain.handle('sysbot:getBuildID',       () => wrap(() => client.getBuildID())());
ipcMain.handle('sysbot:getHeapBase',      () => wrap(() => client.getHeapBase())());
ipcMain.handle('sysbot:getMainNsoBase',   () => wrap(() => client.getMainNsoBase())());
ipcMain.handle('sysbot:getSystemLanguage',() => wrap(() => client.getSystemLanguage())());
ipcMain.handle('sysbot:getVersion',       () => wrap(() => client.getVersion())());
ipcMain.handle('sysbot:charge',           () => wrap(() => client.charge())());
ipcMain.handle('sysbot:game',             (_, info) => wrap(() => client.game(info))());

// Bulk info
ipcMain.handle('sysbot:getInfo', () =>
  wrap(async () => {
    const [titleId, titleVersion, buildId, heapBase, mainNsoBase, language, battery] =
      await Promise.allSettled([
        client.getTitleID(),
        client.getTitleVersion(),
        client.getBuildID(),
        client.getHeapBase(),
        client.getMainNsoBase(),
        client.getSystemLanguage(),
        client.charge(),
      ]);
    return {
      titleId:     titleId.status === 'fulfilled' ? titleId.value : null,
      titleVersion:titleVersion.status === 'fulfilled' ? titleVersion.value : null,
      buildId:     buildId.status === 'fulfilled' ? buildId.value : null,
      heapBase:    heapBase.status === 'fulfilled' ? heapBase.value : null,
      mainNsoBase: mainNsoBase.status === 'fulfilled' ? mainNsoBase.value : null,
      language:    language.status === 'fulfilled' ? language.value : null,
      battery:     battery.status === 'fulfilled' ? battery.value : null,
    };
  })()
);

// Raw command
ipcMain.handle('sysbot:raw', (_, cmd) =>
  wrap(async () => {
    const result = await client.raw(cmd);
    return result ?? '(no response)';
  })()
);
