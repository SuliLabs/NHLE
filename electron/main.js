const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const client = require('./sysbotClient');

const isDev = !!process.env.ELECTRON_START_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'NHLE — New Horizons Live Editor',
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'win32',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL(process.env.ELECTRON_START_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Forward client disconnect events to renderer
  client.on('disconnected', (reason) => {
    win.webContents.send('sysbot:event', { type: 'disconnected', reason });
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

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
