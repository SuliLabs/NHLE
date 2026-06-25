const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('sysbot', {
  // Connection
  connect:    (host, port) => invoke('sysbot:connect', host, port),
  disconnect: ()           => invoke('sysbot:disconnect'),
  status:     ()           => invoke('sysbot:status'),

  // Memory read
  peek:        (addr, size) => invoke('sysbot:peek', addr, size),
  peekAbsolute:(addr, size) => invoke('sysbot:peekAbsolute', addr, size),
  peekMain:    (addr, size) => invoke('sysbot:peekMain', addr, size),

  // Memory write
  poke:        (addr, val) => invoke('sysbot:poke', addr, val),
  pokeAbsolute:(addr, val) => invoke('sysbot:pokeAbsolute', addr, val),
  pokeMain:    (addr, val) => invoke('sysbot:pokeMain', addr, val),

  // Pointer
  pointer:     (chain)       => invoke('sysbot:pointer', chain),
  pointerPeek: (size, chain) => invoke('sysbot:pointerPeek', size, chain),

  // Freeze
  freeze:       (addr, val) => invoke('sysbot:freeze', addr, val),
  unFreeze:     (addr)      => invoke('sysbot:unFreeze', addr),
  freezeClear:  ()          => invoke('sysbot:freezeClear'),
  freezeCount:  ()          => invoke('sysbot:freezeCount'),
  freezePause:  ()          => invoke('sysbot:freezePause'),
  freezeUnpause:()          => invoke('sysbot:freezeUnpause'),

  // Controller
  click:      (btn)         => invoke('sysbot:click', btn),
  press:      (btn)         => invoke('sysbot:press', btn),
  release:    (btn)         => invoke('sysbot:release', btn),
  clickSeq:   (seq)         => invoke('sysbot:clickSeq', seq),
  setStick:   (side, x, y) => invoke('sysbot:setStick', side, x, y),

  // Screen
  pixelPeek:  ()            => invoke('sysbot:pixelPeek'),
  screenOn:   ()            => invoke('sysbot:screenOn'),
  screenOff:  ()            => invoke('sysbot:screenOff'),

  // Info
  getTitleID:        () => invoke('sysbot:getTitleID'),
  getTitleVersion:   () => invoke('sysbot:getTitleVersion'),
  getBuildID:        () => invoke('sysbot:getBuildID'),
  getHeapBase:       () => invoke('sysbot:getHeapBase'),
  getMainNsoBase:    () => invoke('sysbot:getMainNsoBase'),
  getSystemLanguage: () => invoke('sysbot:getSystemLanguage'),
  getVersion:        () => invoke('sysbot:getVersion'),
  charge:            () => invoke('sysbot:charge'),
  game:              (info) => invoke('sysbot:game', info),
  getInfo:           () => invoke('sysbot:getInfo'),

  // Raw
  raw: (cmd) => invoke('sysbot:raw', cmd),

  // Window controls
  minimize: () => invoke('app:minimize'),
  quit:     () => invoke('app:quit'),

  // Sprites (SPR.zip unpack)
  sprites: {
    status:  () => invoke('sprites:status'),
    dir:     () => invoke('sprites:dir'),
    names:   () => invoke('sprites:names'),
    extract: () => invoke('sprites:extract'),
    onProgress: (cb) => {
      const h = (_, data) => cb(data);
      ipcRenderer.on('sprites:progress', h);
      return () => ipcRenderer.removeListener('sprites:progress', h);
    },
  },

  // Events from main
  onEvent: (cb) => {
    ipcRenderer.on('sysbot:event', (_, data) => cb(data));
    return () => ipcRenderer.removeAllListeners('sysbot:event');
  },
});
