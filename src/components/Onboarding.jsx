import { useState, useCallback } from 'react';
import { LANGS } from '../data/langs.js';
import { makeT } from '../data/i18n.js';

/**
 * Launch flow, Animal Crossing styled:
 *   1. ask for Switch IP + port, connect, show a green check
 *   2. ask whether to download item sprites from the internet
 *   3. hand control to the main app
 *
 * Item sprites are fetched live from a public CDN — nothing is bundled in
 * the project and nothing is written to disk; "skip" uses colour tiles only.
 */
export default function Onboarding({ host, setHost, port, setPort, langIdx, setLangIdx, onReady }) {
  const [step, setStep]       = useState('connect'); // connect | sprites
  const [connecting, setConn] = useState(false);
  const [ok, setOk]           = useState(false);
  const [error, setError]     = useState('');
  const t = makeT(langIdx);

  const connect = useCallback(async () => {
    setConn(true); setError(''); setOk(false);
    const res = await window.sysbot.connect(host.trim(), port.trim());
    setConn(false);
    if (res.ok) { setOk(true); setTimeout(() => setStep('sprites'), 650); }
    else setError(res.error || t('couldNotConnect'));
  }, [host, port, t]);

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
                   placeholder="192.168.1.97" spellCheck={false}
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

            <button className="pk-bigbtn w-full text-base mb-2" onClick={() => onReady({ useSprites: true })}>
              ⤓ {t('downloadSprites')}
            </button>
            <button className="pk-bigbtn pk-alt w-full" onClick={() => onReady({ useSprites: false })}>
              {t('skipSprites')}
            </button>
          </>
        )}
      </div>

      <div className="mt-5 text-[11px]" style={{ color: '#eaffd9' }}>ACNH 3.0.3 · sys-botbase</div>
    </div>
  );
}
