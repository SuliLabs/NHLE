import { useState, useCallback, useEffect, useRef } from 'react';
import { LANGS } from '../data/langs.js';
import { makeT } from '../data/i18n.js';
import { setSpritesDir, loadSpriteIndex } from '../data/sprites.js';

/**
 * Launch flow, Animal Crossing styled:
 *   1. ask for Switch IP + port, connect, show a green check
 *   2. first launch only: ask whether to view items with images (Yes/No)
 *      → on Yes, unpack the bundled SPR.zip with an in-app progress bar
 *   3. hand control to the main app
 *
 * The image choice is remembered (localStorage), so after the first run the
 * app jumps straight from "connected" into the editor.
 */
const CHOICE_KEY = 'nhle.sprites'; // 'yes' | 'no'

export default function Onboarding({ host, setHost, port, setPort, langIdx, setLangIdx, initialError = '', onReady }) {
  const [step, setStep]       = useState('connect'); // connect | sprites | unpacking
  const [connecting, setConn] = useState(false);
  const [ok, setOk]           = useState(false);
  const [error, setError]     = useState(initialError);  // e.g. "Disconnected: …" from the app
  const [progress, setProg]   = useState({ done: 0, total: 0 });
  const offRef = useRef(null);
  const busyRef = useRef(false);   // blocks a second Enter while connecting
  const t = makeT(langIdx);

  useEffect(() => () => { offRef.current?.(); }, []);

  // Unpack SPR.zip (or reuse an existing extraction) then enter the app.
  const useImages = useCallback(async () => {
    try { localStorage.setItem(CHOICE_KEY, 'yes'); } catch {}
    setStep('unpacking');
    setProg({ done: 0, total: 0 });
    offRef.current = window.sysbot.sprites.onProgress((p) => setProg(p));
    const res = await window.sysbot.sprites.extract();
    offRef.current?.(); offRef.current = null;
    if (res.ok) {
      setSpritesDir(res.data.dir);
      await loadSpriteIndex();
      onReady({ useSprites: true, spritesDir: res.data.dir });
    } else {
      // extraction failed → fall back to colour tiles rather than blocking
      setError(res.error || 'Unpack failed');
      setStep('sprites');
    }
  }, [onReady]);

  const useTiles = useCallback(() => {
    try { localStorage.setItem(CHOICE_KEY, 'no'); } catch {}
    onReady({ useSprites: false });
  }, [onReady]);

  // After a successful connection, honour a remembered choice or ask once.
  const afterConnect = useCallback(async () => {
    let choice = null;
    try { choice = localStorage.getItem(CHOICE_KEY); } catch {}
    if (choice === 'no') return useTiles();
    if (choice === 'yes') {
      const st = await window.sysbot.sprites.status();
      // already unpacked → go straight in; otherwise unpack now (silent re-run)
      const dir = st.ok ? st.data.dir : null;
      if (st.ok && st.data.extracted) {
        setSpritesDir(dir);
        await loadSpriteIndex();
        return onReady({ useSprites: true, spritesDir: dir });
      }
      return useImages();
    }
    setStep('sprites'); // first launch — ask
  }, [useTiles, useImages, onReady]);

  const connect = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setConn(true); setError(''); setOk(false);
    const res = await window.sysbot.connect(host.trim(), port.trim());
    setConn(false);
    busyRef.current = false;
    if (res.ok) { setOk(true); setTimeout(afterConnect, 650); }
    else setError(res.error || t('couldNotConnect'));
  }, [host, port, t, afterConnect]);

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="pk-onboard h-screen w-screen flex flex-col items-center justify-center select-none relative"
         style={{ WebkitAppRegion: 'drag' }}>
      <div className="absolute top-3 right-3 flex gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
        <button title="Minimize" onClick={() => window.sysbot?.minimize?.()}
                className="w-7 h-7 rounded-full text-white text-lg leading-none hover:bg-white/25">–</button>
        <button title="Close" onClick={() => window.sysbot?.quit?.()}
                className="w-7 h-7 rounded-full text-white text-base leading-none hover:bg-red-500/80">✕</button>
      </div>
      <div className="text-center mb-5" style={{ color: '#fff', textShadow: '0 2px 0 rgba(0,0,0,0.2)' }}>
        <div className="text-5xl leading-none mb-1">🍃</div>
        <div className="text-2xl font-extrabold tracking-wide">NHLE</div>
        <div className="text-sm font-semibold opacity-90">New Horizons Live Editor</div>
      </div>

      <div className="pk-card p-7 w-[380px]" style={{ WebkitAppRegion: 'no-drag' }}>
        {step === 'connect' && (
          <>
            <h2 className="text-lg font-extrabold mb-4 text-center">{t('connectTitle')}</h2>

            <label className="block text-xs font-bold mb-1 opacity-80">{t('language')} · 言語 · 언어</label>
            <select className="pk-input w-full mb-3" style={{ fontSize: 15 }}
                    value={langIdx} onChange={e => setLangIdx(Number(e.target.value))}>
              {LANGS.map(l => <option key={l.idx} value={l.idx}>{l.label}</option>)}
            </select>

            <label className="block text-xs font-bold mb-1 opacity-80">{t('ipAddress')}</label>
            <input className="pk-input w-full mb-3 text-center" style={{ fontSize: 16 }}
                   value={host} onChange={e => setHost(e.target.value)}
                   placeholder="192.168.1.254" spellCheck={false}
                   onKeyDown={e => e.key === 'Enter' && connect()} />

            <label className="block text-xs font-bold mb-1 opacity-80">{t('port')}</label>
            <input className="pk-input w-full mb-4 text-center" style={{ fontSize: 16 }}
                   value={port} onChange={e => setPort(e.target.value)}
                   placeholder="6000" spellCheck={false}
                   onKeyDown={e => e.key === 'Enter' && connect()} />

            <button className="pk-bigbtn w-full text-base" onClick={connect} disabled={connecting}>
              {connecting ? t('connecting') : ok ? `✓ ${t('connected')}` : t('connect')}
            </button>

            {ok && (
              <div className="mt-3 text-center font-bold" style={{ color: 'var(--pk-green)' }}>
                ✓ {t('connectedTo')} {host}
              </div>
            )}
            {error && (
              <div className="mt-3 text-center text-sm font-semibold" style={{ color: '#b23b3b' }}>
                {error}
              </div>
            )}
            <p className="mt-4 text-[11px] text-center opacity-70 leading-snug">
              {t('sysbotHint')}
            </p>
          </>
        )}

        {step === 'sprites' && (
          <>
            <div className="text-center mb-2 font-bold" style={{ color: 'var(--pk-green)' }}>
              ✓ {t('connectedTo')} {host}
            </div>
            <h2 className="text-lg font-extrabold mb-2 text-center">{t('spritesTitle')}</h2>
            <p className="text-[12px] text-center opacity-80 mb-5 leading-snug">
              {t('spritesBody')}
            </p>

            <button className="pk-bigbtn w-full text-base mb-2" onClick={useImages}>
              🖼 {t('spritesYes')}
            </button>
            <button className="pk-bigbtn pk-alt w-full" onClick={useTiles}>
              {t('spritesNo')}
            </button>
          </>
        )}

        {step === 'unpacking' && (
          <>
            <div className="text-center mb-2 font-bold" style={{ color: 'var(--pk-green)' }}>
              ✓ {t('connectedTo')} {host}
            </div>
            <h2 className="text-lg font-extrabold mb-4 text-center">{t('spritesUnpacking')}</h2>
            <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-150"
                   style={{ width: `${pct}%`, background: 'var(--pk-green)' }} />
            </div>
            <div className="mt-2 text-center text-sm font-bold tabular-nums">
              {pct}%{progress.total > 0 && <span className="opacity-60 font-semibold"> · {progress.done}/{progress.total}</span>}
            </div>
          </>
        )}
      </div>

      <div className="mt-5 text-[11px] text-center" style={{ color: '#eaffd9' }}>
        <div>ACNH 3.0.3 · sys-botbase</div>
        <div className="mt-1 font-bold opacity-90">made by SuliLabs</div>
      </div>
    </div>
  );
}
