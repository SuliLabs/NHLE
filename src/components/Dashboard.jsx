import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import {
  ADDR, PHYSICS, getSlotAddress, buildItem, decodeItem, itemKind, WRAP_PAPERS,
  islandNameAddr, characterNameAddr, decodeUtf16le, isCleanName,
} from '../data/acnh.js';
import { getItemSlotBase } from '../data/overrides.js';
import { LANGS } from '../data/langs.js';
import { makeT } from '../data/i18n.js';
import { spriteCandidates } from '../data/sprites.js';

/* ───────────────────────── shared helpers ───────────────────────── */
const COLOR_HEX = {
  Aqua: '#7fd4d4', Beige: '#d9c9a3', Black: '#3a3a3a', Blue: '#5a7fd0',
  Brown: '#9c7048', Colorful: '#c08fd0', Gray: '#9aa0a8', Green: '#7bba6b',
  Grey: '#9aa0a8', Orange: '#e2904a', Pink: '#e69ec0', Purple: '#9a78c8',
  Red: '#d05a5a', White: '#e8e8ec', Yellow: '#e6cf5a', None: '#cbb985',
};
const EMPTY = 'FFFE';
const hexA = (n) => '0x' + (n >>> 0).toString(16).toUpperCase();

let _db = null;
function parseDB(text) {
  const out = [];
  for (const line of text.split('\n').slice(1)) {
    const p = line.split(' ; ');
    if (p.length < 3) continue;
    const id = p[0].trim();
    if (!id) continue;
    out.push({ id, internal: (p[1] || '').trim(), names: p.map(s => s.trim()), color: (p[13] || 'None').trim() });
  }
  return out;
}
// Read a CSV via IPC (works in the packaged file:// build); dev http fallback.
async function readData(name) {
  if (window.sysbot?.readData) {
    const r = await window.sysbot.readData(name);
    if (r?.ok) return r.data;
  }
  return fetch(`data/${name}`).then(r => r.text());
}
async function loadDB() {
  if (_db) return _db;
  const [items, recipes, variations] = await Promise.all([
    readData('items.csv'),
    readData('recipes.csv'),
    readData('variations.csv'),
  ]);
  const varSet = new Set(variations.split('\n').slice(1).map(l => l.split(' ; ')[0]?.trim().toUpperCase()).filter(Boolean));
  _db = { items: parseDB(items), recipes: parseDB(recipes), varSet };
  return _db;
}

function ItemIcon({ internal, color, sprites, variation, pattern }) {
  const candidates = sprites ? spriteCandidates(internal, variation, pattern) : [];
  const key = candidates.join('|');
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [key]);
  const swatch = COLOR_HEX[color] || COLOR_HEX.None;
  const src = candidates[idx];
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="absolute inset-1.5 rounded-md" style={{ background: swatch }} />
      {src && (
        <img src={src} alt="" draggable={false} loading="lazy" decoding="async"
             onError={() => setIdx(i => i + 1)}
             className="relative max-w-[86%] max-h-[86%] object-contain" />
      )}
    </span>
  );
}

function Toggle({ on, onClick, disabled }) {
  return <button className={`pk-toggle ${on ? 'pk-on' : ''}`} onClick={onClick} disabled={disabled} type="button" />;
}

/* ───────────────────────── shell ───────────────────────── */
const NAV = [
  { id: 'home',      key: 'nav_home',      ic: '🏝️' },
  { id: 'inventory', key: 'nav_inventory', ic: '🎒' },
  { id: 'trucos',    key: 'nav_trucos',    ic: '✨' },
  { id: 'avanzado',  key: 'nav_avanzado',  ic: '🧬' },
];

export default function Dashboard({ connected, host, port, onDisconnect, error, useSprites = true, langIdx = 9, setLangIdx }) {
  const [tab, setTab] = useState('home');
  const t = makeT(langIdx);

  return (
    <div className="nh-root flex flex-col h-screen overflow-hidden select-none">
      {/* top bar */}
      <div className="nh-top flex items-center gap-3 px-4 py-2.5 shrink-0">
        <div className="nh-logo">🍃</div>
        <div className="leading-tight">
          <div className="font-extrabold text-[15px]">NHLE</div>
          <div className="text-[10px] opacity-60 font-semibold -mt-0.5">New Horizons Live Editor</div>
        </div>

        <span className="nh-chip nh-no-drag ml-2">
          <span className="nh-dot" style={{ background: connected ? '#5cc24a' : '#d3b94e', boxShadow: connected ? '0 0 6px #5cc24a' : 'none' }} />
          {connected ? `${host}:${port}` : t('offline')}
        </span>

        <div className="ml-auto flex items-center gap-2 nh-no-drag">
          <select className="pk-select" style={{ borderRadius: 999, padding: '5px 12px' }}
                  value={langIdx} onChange={e => setLangIdx(Number(e.target.value))}>
            {LANGS.map(l => <option key={l.idx} value={l.idx}>{l.label}</option>)}
          </select>
          {connected && (
            <button className="pk-btn" style={{ borderRadius: 999 }} onClick={onDisconnect}>{t('disconnect')}</button>
          )}
          <button className="nh-winbtn" title="–" onClick={() => window.sysbot?.minimize?.()}>–</button>
          <button className="nh-winbtn nh-close" title="✕" onClick={() => window.sysbot?.quit?.()}>✕</button>
        </div>
      </div>

      {/* pill nav */}
      <div className="px-4 pt-3 pb-1 shrink-0 flex items-center">
        <nav className="nh-nav">
          {NAV.map(n => (
            <button key={n.id} className={`nh-pill ${tab === n.id ? 'nh-on' : ''}`} onClick={() => setTab(n.id)}>
              <span className="nh-pill-ic">{n.ic}</span>{t(n.key)}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="mx-4 mt-2 px-4 py-2 rounded-2xl text-[12px] font-semibold shrink-0"
             style={{ background: '#fbe0e0', color: '#8a3a3a', border: '1px solid #e7a3a3' }}>
          {error}
        </div>
      )}

      {/* content */}
      <div className="flex-1 overflow-hidden px-4 py-3 min-h-0">
        {tab === 'home'      && <HomePanel      connected={connected} host={host} port={port} t={t} />}
        {tab === 'inventory' && <InventoryPanel connected={connected} useSprites={useSprites} langIdx={langIdx} t={t} />}
        {tab === 'trucos'    && <TrucosPanel    connected={connected} t={t} />}
        {tab === 'avanzado'  && <AvanzadoPanel  connected={connected} t={t} />}
      </div>
    </div>
  );
}

/* ───────────────────────── HOME ───────────────────────── */
function HomePanel({ connected, host, port, t }) {
  const [info, setInfo]      = useState(null);
  const [island, setIsland]  = useState(undefined);   // undefined=loading, ''=none, string=name
  const [character, setChar] = useState(undefined);
  const [busy, setBusy]      = useState(false);

  const read = useCallback(async () => {
    if (!connected) return;
    setBusy(true);
    try { const res = await window.sysbot.getInfo(); if (res.ok) setInfo(res.data); } catch { /* ignore */ }

    // Island + character names — live reads from offsets verified on 3.0.3.
    const base = getItemSlotBase() ?? ADDR.ItemSlotBase;
    try {
      const r = await window.sysbot.peek(hexA(islandNameAddr(base)), 22);
      if (r.ok) { const name = decodeUtf16le(r.data, 10); setIsland(isCleanName(name) ? name : ''); }
      else setIsland('');
    } catch { setIsland(''); }
    try {
      const r = await window.sysbot.peek(hexA(characterNameAddr(base)), 22);
      if (r.ok) { const name = decodeUtf16le(r.data, 10); setChar(isCleanName(name) ? name : ''); }
      else setChar('');
    } catch { setChar(''); }
    setBusy(false);
  }, [connected]);

  useEffect(() => { if (connected) read(); }, [connected, read]);

  const nameOrDash = (v) => (v === undefined ? t('home_reading') : (v || '—'));
  const battery = info?.battery != null ? `${info.battery}%` : '—';

  return (
    <div className="h-full overflow-auto pr-1">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xl font-extrabold">{t('nav_home')}</h2>
        <button className="pk-btn" style={{ borderRadius: 999 }} disabled={!connected || busy} onClick={read}>
          {busy ? '…' : t('refreshData')}
        </button>
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        <div className="nh-card">
          <div className="nh-card-label">🎮 {t('home_game')}</div>
          <div className="nh-card-value mt-1.5">Animal Crossing</div>
          <div className="nh-card-sub">New Horizons</div>
          <div className="nh-kv mt-2"><span className="k">{t('home_version')}</span><span className="v">{info?.titleVersion || (connected ? '…' : '—')}</span></div>
        </div>

        <div className="nh-card">
          <div className="nh-card-label">🏝️ {t('home_island')}</div>
          <div className="nh-card-value mt-1.5" style={{ color: 'var(--pk-green)' }}>{nameOrDash(island)}</div>
          {island === '' && <div className="nh-card-sub mt-1">{t('home_unverified')}</div>}
        </div>

        <div className="nh-card">
          <div className="nh-card-label">🧍 {t('home_character')}</div>
          <div className="nh-card-value mt-1.5" style={{ color: 'var(--pk-green)' }}>{nameOrDash(character)}</div>
          {character === '' && <div className="nh-card-sub mt-1">{t('home_unverified')}</div>}
        </div>

        <div className="nh-card">
          <div className="nh-card-label">🖥️ {t('home_system')}</div>
          <div className="nh-kv mt-1.5"><span className="k">{t('home_battery')}</span><span className="v">{battery}</span></div>
          <div className="nh-kv"><span className="k">{t('home_sysLang')}</span><span className="v">{info?.language || '—'}</span></div>
          <div className="nh-kv"><span className="k">{t('home_build')}</span><span className="v" style={{ fontSize: 11 }}>{info?.buildId ? String(info.buildId).slice(0, 12) : '—'}</span></div>
        </div>

        <div className="nh-card">
          <div className="nh-card-label">🔗 {t('home_connection')}</div>
          <div className="nh-kv mt-1.5"><span className="k">IP</span><span className="v">{host}</span></div>
          <div className="nh-kv"><span className="k">{t('port')}</span><span className="v">{port}</span></div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── INVENTORY ───────────────────────── */
function InventoryPanel({ connected, useSprites, langIdx, t }) {
  const [db, setDb]       = useState({ items: [], recipes: [], varSet: new Set() });
  const [dbReady, setRdy] = useState(false);
  const [slots, setSlots] = useState(Array(40).fill(null));
  const [busy, setBusy]   = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [listTab, setListTab] = useState('items');   // items | recipes
  const [selected, setSel]  = useState(null);
  const [itemId, setItemId] = useState('');
  const [amount, setAmount] = useState('1');
  const [variation, setVar] = useState(0);
  const [paper, setPaper]   = useState(-1);
  const [buried, setBuried] = useState(false);

  const lang = LANGS.find(l => l.idx === langIdx) || LANGS[0];
  const nameOf = useCallback((it) => (it?.names?.[lang.idx] || it?.names?.[2] || it?.id || ''), [lang]);

  useEffect(() => { loadDB().then(d => { setDb(d); setRdy(true); }); }, []);

  const allById = useMemo(() => {
    const m = new Map();
    for (const it of db.items)   m.set(it.id.toUpperCase(), it);
    for (const it of db.recipes) if (!m.has(it.id.toUpperCase())) m.set(it.id.toUpperCase(), it);
    return m;
  }, [db]);

  const listSource = useMemo(() => {
    if (listTab === 'recipes') return db.recipes;   // DIY recipe to learn/craft the item
    return db.items;                                // the item itself
  }, [listTab, db]);

  // Deferred: typing stays responsive; the 500-row list re-renders just after.
  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();   // case-insensitive search…
    if (!q) return listSource.slice(0, 500);
    const out = [];
    for (const i of listSource) {
      if (nameOf(i).toLowerCase().includes(q) || i.id.toLowerCase().includes(q)) {
        out.push(i);
        if (out.length >= 500) break;   // stop scanning once the cap is hit
      }
    }
    return out;
  }, [deferredSearch, listSource, nameOf]);

  const refresh = useCallback(async () => {
    if (!connected) return;
    setBusy(true); setStatus(t('home_reading'));
    const next = Array(40).fill(null);
    try {
      const base = getItemSlotBase() ?? ADDR.ItemSlotBase;
      const [r1, r2] = await Promise.all([
        window.sysbot.peek(hexA(getSlotAddress(1, base)), 160),
        window.sysbot.peek(hexA(getSlotAddress(21, base)), 160),
      ]);
      if (r1.ok) for (let i = 0; i < 20; i++) next[i]      = decodeItem(r1.data.slice(i*16, i*16+16));
      if (r2.ok) for (let i = 0; i < 20; i++) next[20 + i] = decodeItem(r2.data.slice(i*16, i*16+16));
      setSlots(next); setStatus('');
    } catch (e) { setStatus('Error: ' + e.message); }
    setBusy(false);
  }, [connected, t]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  const editId   = (itemId || selected?.id || '').toUpperCase();
  const editKind = itemKind(editId, db.varSet);
  const pick = (it) => { setSel(it); setItemId(it.id.toUpperCase()); };

  const currentBytes = useCallback(() => {
    const id = (itemId || selected?.id || EMPTY).replace(/^0x/i, '').toUpperCase();
    const kind = itemKind(id, db.varSet);
    let qty = parseInt(amount, 10); if (isNaN(qty) || qty < 1) qty = 1;
    return buildItem(id, { kind, count: qty, variation: variation & 7, wrap: paper >= 0, paper: Math.max(0, paper), buried });
  }, [itemId, selected, amount, variation, paper, buried, db.varSet]);

  const writeSlot = (idx, bytes) => window.sysbot.poke(hexA(getSlotAddress(idx + 1, getItemSlotBase() ?? ADDR.ItemSlotBase)), bytes);

  const inject = useCallback(async (idx) => {
    if (!connected || (!itemId && !selected)) { setStatus(t('pickItem')); setTimeout(() => setStatus(''), 1400); return; }
    const bytes = currentBytes();
    const res = await writeSlot(idx, bytes);
    if (res.ok) setSlots(s => { const n = [...s]; n[idx] = decodeItem(bytes.slice(2)); return n; });
    else setStatus('Error: ' + res.error);
    setTimeout(() => setStatus(''), 1400);
  }, [connected, itemId, selected, currentBytes, t]);

  const clearOne = useCallback(async (idx) => {
    if (!connected) return;
    const res = await writeSlot(idx, buildItem(EMPTY));
    if (res.ok) setSlots(s => { const n = [...s]; n[idx] = decodeItem(buildItem(EMPTY).slice(2)); return n; });
  }, [connected]);

  const fillEmpty = useCallback(async () => {
    if (!connected || (!itemId && !selected)) return;
    setBusy(true); const bytes = currentBytes();
    for (let i = 0; i < 40; i++) { const s = slots[i]; if (!s || s.itemId === EMPTY) await writeSlot(i, bytes); }
    await refresh(); setBusy(false);
  }, [connected, itemId, selected, currentBytes, slots, refresh]);

  const fillAll = useCallback(async () => {
    if (!connected || (!itemId && !selected)) return;
    setBusy(true); const bytes = currentBytes();
    for (let i = 0; i < 40; i++) await writeSlot(i, bytes);
    await refresh(); setBusy(false);
  }, [connected, itemId, selected, currentBytes, refresh]);

  const clearAll = useCallback(async () => {
    if (!connected) return;
    setBusy(true); const bytes = buildItem(EMPTY);
    for (let i = 0; i < 40; i++) await writeSlot(i, bytes);
    await refresh(); setBusy(false);
  }, [connected, refresh]);

  return (
    <div className="h-full flex gap-4 min-h-0">
      {/* left: grid + editor */}
      <div className="flex flex-col min-w-0 min-h-0 flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-extrabold">{t('nav_inventory')}</h2>
          <button className="pk-btn" style={{ borderRadius: 999 }} disabled={!connected || busy} onClick={refresh}>{busy ? '…' : t('refreshData')}</button>
          {status && <span className="text-[12px] opacity-70">{status}</span>}
        </div>

        <div className="nh-card flex-1 min-h-0 overflow-auto" style={{ padding: 14 }}>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))' }}>
            {slots.map((slot, i) => {
              const empty = !slot || slot.itemId === EMPTY;
              const it = empty ? null : allById.get(slot.itemId);
              const kind = empty ? null : itemKind(slot.itemId, db.varSet);
              const badge = empty ? '' : (kind === 'variable' ? `v${slot.variation}` : (slot.count > 1 ? slot.count : ''));
              return (
                <div key={i} className={`pk-slot ${empty ? 'pk-empty' : ''}`} style={{ aspectRatio: '1 / 1' }}
                     onClick={() => inject(i)} onContextMenu={e => { e.preventDefault(); clearOne(i); }}
                     title={empty ? `${i+1} —` : `${i+1}: ${(it ? nameOf(it) : slot.itemId).toUpperCase()}${slot.count > 1 ? ' ×' + slot.count : ''}`}>
                  {!empty && <ItemIcon internal={it?.internal} color={it?.color} sprites={useSprites}
                                       variation={kind === 'variable' ? slot.variation : undefined}
                                       pattern={kind === 'variable' ? slot.pattern : undefined} />}
                  {!empty && slot.wrap && <span className="absolute top-0 right-1 text-[10px]">🎁</span>}
                  {!empty && badge !== '' && (
                    <span className="absolute bottom-0 inset-x-0 text-center text-[10px] font-bold leading-4 truncate"
                          style={{ background: 'rgba(92,74,48,0.55)', color: '#fff' }}>{badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* editor */}
        <div className="nh-card mt-3" style={{ padding: 14 }}>
          <div className="flex items-end gap-3 flex-wrap">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] opacity-60 font-bold">ID</span>
              <input className="pk-input font-mono" style={{ width: 84 }} value={itemId}
                     onChange={e => setItemId(e.target.value.toUpperCase())} placeholder="0000" />
            </label>
            {editKind === 'variable' ? (
              <label className="flex flex-col gap-1">
                <span className="text-[11px] opacity-60 font-bold">{t('variation')}</span>
                <input className="pk-input font-mono" style={{ width: 64 }} type="number" min="0" max="7" value={variation}
                       onChange={e => setVar(Math.max(0, Math.min(7, Number(e.target.value) || 0)))} />
              </label>
            ) : (
              <label className="flex flex-col gap-1">
                <span className="text-[11px] opacity-60 font-bold">{t('amount')}</span>
                <input className="pk-input font-mono" style={{ width: 80 }} value={amount} onChange={e => setAmount(e.target.value)} />
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] opacity-60 font-bold">{t('wrapping')}</span>
              <select className="pk-select" value={paper} onChange={e => setPaper(Number(e.target.value))}>
                <option value={-1}>{t('wrapNone')}</option>
                {WRAP_PAPERS.map((p, i) => <option key={i} value={i}>{p}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-[11px] opacity-60 font-bold">{t('buried')}</span>
              <Toggle on={buried} onClick={() => setBuried(b => !b)} />
            </label>
            <div className="flex gap-1.5 ml-auto">
              <button className="pk-btn" style={{ borderRadius: 999 }} disabled={!connected} onClick={fillEmpty}>{t('fillRemain')}</button>
              <button className="pk-btn" style={{ borderRadius: 999 }} disabled={!connected} onClick={fillAll}>{t('spawnAll')}</button>
              <button className="nh-danger" style={{ fontSize: 12, padding: '6px 14px' }} disabled={!connected} onClick={clearAll}>{t('clearAll')}</button>
            </div>
          </div>
          <div className="text-[11px] opacity-55 mt-2">{t('gridHint')}</div>
        </div>
      </div>

      {/* right: searchable item list (uppercase) */}
      <div className="nh-card flex flex-col min-h-0 h-full shrink-0" style={{ width: 330, padding: 12 }}>
        <div className="nh-seg mb-2 shrink-0">
          {[['items', 'bottom_Item'], ['recipes', 'bottom_Recipe']].map(([id, key]) => (
            <button key={id} type="button" onClick={() => setListTab(id)}
                    className={`nh-seg-btn ${listTab === id ? 'nh-on' : ''}`}>{t(key)}</button>
          ))}
        </div>
        <div className="relative mb-2 shrink-0">
          <input className="nh-search" style={{ paddingRight: 36 }} placeholder={`🔎 ${t('search')}`}
                 value={search} onChange={e => setSearch(e.target.value)} spellCheck={false}
                 onKeyDown={e => e.key === 'Escape' && setSearch('')} />
          {search && (
            <button type="button" onClick={() => setSearch('')} title="✕" className="nh-search-clear">✕</button>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto -mr-1 pr-1">
          {!dbReady && <div className="text-center text-xs opacity-60 py-6">{t('loadingDb')}</div>}
          {filtered.map((it) => (
            <div key={it.id} onClick={() => pick(it)} className={`nh-row ${selected?.id === it.id ? 'nh-sel' : ''}`}>
              <span className="relative block shrink-0" style={{ width: 26, height: 26 }}>
                <ItemIcon internal={it.internal} color={it.color} sprites={useSprites} />
              </span>
              <span className="flex-1 truncate">{nameOf(it).toUpperCase()}</span>
            </div>
          ))}
          {dbReady && filtered.length === 0 && <div className="text-center text-xs opacity-60 py-6">{t('noResults')}</div>}
        </div>
        <div className="text-[11px] opacity-55 pt-2 text-center shrink-0">{filtered.length} {t('inv_items')}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── CHEATS (freeze time) ───────────────────────── */
function TrucosPanel({ connected, t }) {
  const [time, setTime]     = useState(false);
  const [status, setStatus] = useState('');

  // Reflect the real in-game state: read the patched instruction on entry.
  useEffect(() => {
    if (!connected) return;
    let alive = true;
    window.sysbot.peekMain(hexA(ADDR.FreezeTime), 4).then(r => {
      if (alive && r.ok) setTime(r.data.toUpperCase().startsWith(PHYSICS.freezeTime));
    }).catch(() => {});
    return () => { alive = false; };
  }, [connected]);

  const setFreeze = async (frz) => {
    const r = await window.sysbot.pokeMain(hexA(ADDR.FreezeTime), '0x' + (frz ? PHYSICS.freezeTime : PHYSICS.unfreezeTime));
    if (r.ok) { setTime(frz); setStatus(frz ? `${t('freezeTime')} ✓` : '—'); }
    else setStatus('Error');
    setTimeout(() => setStatus(''), 1800);
  };

  return (
    <div className="h-full overflow-auto pr-1">
      <h2 className="text-xl font-extrabold mb-3">{t('nav_trucos')}</h2>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', maxWidth: 720 }}>
        <div className="nh-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-extrabold text-[15px]">⏰ {t('freezeTime')}</div>
              <div className="nh-card-sub mt-0.5">{t('freezeTimeDesc')}</div>
            </div>
            <Toggle on={time} onClick={() => setFreeze(!time)} disabled={!connected} />
          </div>
          {status && <div className="text-[12px] mt-2" style={{ color: 'var(--pk-green)' }}>{status}</div>}
        </div>
      </div>
      <p className="text-[12px] opacity-55 mt-3">{t('trucos_more')}</p>
    </div>
  );
}

/* ───────────────────────── ADVANCED (RAM editor) ───────────────────────── */
const ADV_KEY = 'nhle.advAccepted';
const REGIONS = [
  { id: 'heap',     label: 'Heap',     peek: 'peek',         poke: 'poke' },
  { id: 'main',     label: 'Main',     peek: 'peekMain',     poke: 'pokeMain' },
  { id: 'absolute', label: 'Absolute', peek: 'peekAbsolute', poke: 'pokeAbsolute' },
];

function AvanzadoPanel({ connected, t }) {
  const [accepted, setAccepted] = useState(() => { try { return localStorage.getItem(ADV_KEY) === '1'; } catch { return false; } });
  const [region, setRegion] = useState('heap');
  const [addr, setAddr]     = useState('0xB29BB758');
  const [size, setSize]     = useState('16');
  const [value, setValue]   = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');

  const accept = () => { try { localStorage.setItem(ADV_KEY, '1'); } catch {} setAccepted(true); };
  const reg = REGIONS.find(r => r.id === region) || REGIONS[0];
  const cleanAddr = () => { const a = addr.trim().replace(/^0x/i, ''); return /^[0-9a-fA-F]+$/.test(a) ? '0x' + a.toUpperCase() : null; };

  const doRead = async () => {
    if (!connected) return;
    const a = cleanAddr(); const n = parseInt(size, 10);
    if (!a || isNaN(n) || n < 1 || n > 1024) { setStatus(t('adv_invalid')); return; }
    const res = await window.sysbot[reg.peek](a, n);
    if (res.ok) { setResult(res.data); setValue(res.data); setStatus(''); }
    else setStatus('Error: ' + res.error);
  };

  const doWrite = async () => {
    if (!connected) return;
    const a = cleanAddr(); const v = value.trim().replace(/^0x/i, '').replace(/\s+/g, '');
    if (!a || !/^[0-9a-fA-F]+$/.test(v) || v.length % 2 !== 0) { setStatus(t('adv_invalid')); return; }
    const res = await window.sysbot[reg.poke](a, '0x' + v.toUpperCase());
    setStatus(res.ok ? `${t('adv_writeOk')} ✓` : 'Error: ' + res.error);
    setTimeout(() => setStatus(''), 1800);
  };

  if (!accepted) {
    return (
      <div className="h-full overflow-auto flex items-start justify-center pt-6">
        <div className="nh-warn" style={{ maxWidth: 560 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg font-extrabold">{t('adv_disTitle')}</h2>
          </div>
          <p className="text-[13px] leading-relaxed mb-4">{t('adv_disBody')}</p>
          <button className="nh-danger w-full" onClick={accept}>{t('adv_accept')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto pr-1">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xl font-extrabold">{t('nav_avanzado')}</h2>
        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: '#e7b94e', color: '#5a3f08' }}>
          ⚠ {t('adv_riskBadge')}
        </span>
      </div>

      <div className="nh-card" style={{ maxWidth: 720 }}>
        <div className="flex items-end gap-3 flex-wrap">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] opacity-60 font-bold">{t('adv_region')}</span>
            <select className="pk-select" value={region} onChange={e => setRegion(e.target.value)}>
              {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 flex-1" style={{ minWidth: 180 }}>
            <span className="text-[11px] opacity-60 font-bold">{t('adv_address')}</span>
            <input className="pk-input font-mono" value={addr} onChange={e => setAddr(e.target.value)} placeholder="0x..." spellCheck={false} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] opacity-60 font-bold">{t('adv_size')}</span>
            <input className="pk-input font-mono" style={{ width: 80 }} value={size} onChange={e => setSize(e.target.value)} />
          </label>
          <button className="pk-btn" style={{ borderRadius: 999, padding: '8px 18px' }} disabled={!connected} onClick={doRead}>{t('adv_read')}</button>
        </div>

        <label className="flex flex-col gap-1 mt-3">
          <span className="text-[11px] opacity-60 font-bold">{t('adv_value')}</span>
          <textarea className="pk-input font-mono" style={{ width: '100%', minHeight: 64, resize: 'vertical' }}
                    value={value} onChange={e => setValue(e.target.value)} spellCheck={false} placeholder="DEADBEEF…" />
        </label>

        <div className="flex items-center gap-3 mt-3">
          <button className="nh-danger" disabled={!connected} onClick={doWrite}>{t('adv_write')}</button>
          {status && <span className="text-[12px] font-semibold" style={{ color: status.includes('✓') ? 'var(--pk-green)' : '#a34' }}>{status}</span>}
        </div>

        {result && (
          <div className="mt-3">
            <div className="text-[11px] opacity-60 font-bold mb-1">{t('adv_result')}</div>
            <div className="font-mono text-[12px] break-all p-2.5 rounded-xl" style={{ background: '#fffdf4', border: '1px solid var(--pk-slot-bd)' }}>{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}
