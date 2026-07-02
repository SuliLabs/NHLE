import { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import { setSpritesDir } from './data/sprites.js';

// Remembered connection settings, so the user doesn't retype the IP every run.
const LS = { host: 'nhle.host', port: 'nhle.port', lang: 'nhle.lang' };
const remember = (key, val) => { try { localStorage.setItem(key, String(val)); } catch {} };
const recall = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };

export default function App() {
  const [phase, setPhase]     = useState('onboard'); // onboard | app
  const [connected, setConn]  = useState(false);
  const [host, setHost]       = useState(() => recall(LS.host, '192.168.1.254'));
  const [port, setPort]       = useState(() => recall(LS.port, '6000'));
  const [useSprites, setUseSprites] = useState(true);
  const [langIdx, setLangIdx] = useState(() => Number(recall(LS.lang, 9)) || 9);
  const [error, setError]     = useState('');

  useEffect(() => { remember(LS.lang, langIdx); }, [langIdx]);

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
    remember(LS.host, host);
    remember(LS.port, port);
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
        initialError={error}
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
