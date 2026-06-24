import { useState, useEffect, useCallback } from 'react';
import ConnectionPanel from './components/ConnectionPanel';
import Dashboard from './components/Dashboard';
import MemoryEditor from './components/MemoryEditor';
import CheatManager from './components/CheatManager';
import ControllerPad from './components/ControllerPad';
import ScreenViewer from './components/ScreenViewer';
import Console from './components/Console';
import ACNHPanel from './components/ACNHPanel';

const TABS = [
  { id: 'acnh',        label: 'ACNH',        icon: '🍃' },
  { id: 'dashboard',   label: 'Dashboard',   icon: '◈' },
  { id: 'memory',      label: 'Memory',      icon: '⬡' },
  { id: 'cheats',      label: 'Cheats',      icon: '❄' },
  { id: 'controller',  label: 'Controller',  icon: '◉' },
  { id: 'screen',      label: 'Screen',      icon: '▣' },
  { id: 'console',     label: 'Console',     icon: '>_' },
];

export default function App() {
  const [tab, setTab] = useState('acnh');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [host, setHost] = useState('192.168.1.97');
  const [port, setPort] = useState('6000');
  const [error, setError] = useState('');

  useEffect(() => {
    window.sysbot?.status().then(r => {
      if (r.ok && r.data.connected) {
        setConnected(true);
        setHost(r.data.host);
        setPort(String(r.data.port));
      }
    });

    const cleanup = window.sysbot?.onEvent((ev) => {
      if (ev.type === 'disconnected') {
        setConnected(false);
        setError(`Disconnected: ${ev.reason}`);
      }
    });
    return cleanup;
  }, []);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setError('');
    const res = await window.sysbot.connect(host.trim(), port.trim());
    setConnecting(false);
    if (res.ok) {
      setConnected(true);
    } else {
      setError(res.error);
    }
  }, [host, port]);

  const handleDisconnect = useCallback(async () => {
    await window.sysbot.disconnect();
    setConnected(false);
    setError('');
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-2 bg-[#0d0d18] border-b border-gray-800 shrink-0" style={{ WebkitAppRegion: 'drag' }}>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <span className="text-cyan-400 font-bold text-lg tracking-widest">NHLE</span>
          <span className="text-gray-500 text-xs tracking-wide hidden sm:inline">New Horizons Live Editor</span>
        </div>

        <div className="flex-1" style={{ WebkitAppRegion: 'drag' }} />

        {/* Connection controls */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          {error && (
            <span className="text-red-400 text-xs truncate max-w-xs">{error}</span>
          )}
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 glow-green' : 'bg-red-500'}`} />

          <ConnectionPanel
            host={host} setHost={setHost}
            port={port} setPort={setPort}
            connected={connected}
            connecting={connecting}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="flex flex-col gap-1 p-2 bg-[#0d0d18] border-r border-gray-800 w-16 shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.label}
              className={`flex flex-col items-center justify-center gap-0.5 py-3 px-1 rounded text-xs transition-all duration-150
                ${tab === t.id
                  ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent'
                }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span className="text-[9px] leading-none">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className={`flex-1 bg-[#0a0a0f] ${tab === 'memory' ? 'overflow-hidden flex flex-col p-2' : 'overflow-auto p-4'}`}>
          {!connected && tab !== 'console' && (
            <div className="mb-3 px-3 py-2 bg-amber-900/20 border border-amber-800/50 rounded text-amber-400 text-xs shrink-0">
              Not connected to Switch — connect using the controls above.
            </div>
          )}
          {tab === 'acnh'       && <ACNHPanel  connected={connected} />}
          {tab === 'dashboard'  && <Dashboard connected={connected} />}
          {tab === 'memory'     && <MemoryEditor connected={connected} />}
          {tab === 'cheats'     && <CheatManager connected={connected} />}
          {tab === 'controller' && <ControllerPad connected={connected} />}
          {tab === 'screen'     && <ScreenViewer connected={connected} />}
          {tab === 'console'    && <Console connected={connected} />}
        </main>
      </div>
    </div>
  );
}
