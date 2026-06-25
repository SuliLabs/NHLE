import { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { setSpritesDir } from './data/sprites.js';

export default function App() {
  const [phase, setPhase]     = useState('onboard'); // onboard | app
  const [connected, setConn]  = useState(false);
  const [connecting, setBusy] = useState(false);
  const [host, setHost]       = useState('192.168.1.254');
  const [port, setPort]       = useState('6000');
  const [useSprites, setUseSprites] = useState(true);
  const [langIdx, setLangIdx] = useState(9); // chosen on the launch screen
  const [error, setError]     = useState('');

  // If the Switch drops, bounce back to the launch screen.
  useEffect(() => {
    const cleanup = window.sysbot?.onEvent((ev) => {
      if (ev.type === 'disconnected') {
        setConn(false);
        setPhase('onboard');
        setError(`Disconnected: ${ev.reason}`);
      }
    });
    return cleanup;
  }, []);

  const handleReady = useCallback(({ useSprites, spritesDir }) => {
    setUseSprites(useSprites);
    if (useSprites && spritesDir) setSpritesDir(spritesDir);
    setConn(true);
    setError('');
    setPhase('app');
  }, []);

  const handleConnect = useCallback(async () => {
    setBusy(true); setError('');
    const res = await window.sysbot.connect(host.trim(), port.trim());
    setBusy(false);
    if (res.ok) setConn(true);
    else setError(res.error);
  }, [host, port]);

  const handleDisconnect = useCallback(async () => {
    await window.sysbot.disconnect();
    setConn(false);
    setPhase('onboard');
  }, []);

  if (phase === 'onboard') {
    return (
      <Onboarding
        host={host} setHost={setHost}
        port={port} setPort={setPort}
        langIdx={langIdx} setLangIdx={setLangIdx}
        onReady={handleReady}
      />
    );
  }

  return (
    <Dashboard
      connected={connected}
      host={host} port={port}
      onDisconnect={handleDisconnect}
      error={error}
      useSprites={useSprites}
      langIdx={langIdx} setLangIdx={setLangIdx}
    />
  );
}
