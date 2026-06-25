import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ADDR, PHYSICS, TURNIP_DAYS, getSlotAddress, buildItemBytes } from '../data/acnh.js';
import { getItemSlotBase } from '../data/overrides.js';
import { HEMI, TARGETS, findSeed, forecastDay, targetFeasibility } from '../data/weather.js';
import { LANGS } from '../data/langs.js';
import { makeT } from '../data/i18n.js';

/* ─────────────────────────────────────────────────────────────────────
 * Only features that were verified by reverse-engineering and confirmed
 * working on ACNH 3.0.3 are exposed here:
 *   Inventory   – ItemSlotBase           ✓ confirmed
 *   Storage     – HomeStorageBase        ✓ confirmed
 *   Recycling   – RecyclingBase          ✓ confirmed (in-game verified)
 *   Turnips     – TurnipBuyPrice/SellBase ✓ confirmed
 *   Cheats      – Collision / ActorCollision / FreezeTime [MAIN] ✓ confirmed
 *   Weather     – WeatherSeed            ✓ confirmed
 * Anything tentative or unverified (villagers, map, speed, shop, dodo,
 * coordinates) is deliberately left out.
 * ──────────────────────────────────────────────────────────────────── */

const COLOR_HEX = {
  Aqua: '#7fd4d4', Beige: '#d9c9a3', Black: '#3a3a3a', Blue: '#5a7fd0',
  Brown: '#9c7048', Colorful: '#c08fd0', Gray: '#9aa0a8', Green: '#7bba6b',
  Grey: '#9aa0a8', Orange: '#e2904a', Pink: '#e69ec0', Purple: '#9a78c8',
  Red: '#d05a5a', White: '#e8e8ec', Yellow: '#e6cf5a', None: '#cbb985',
};

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
async function loadDB() {
  if (_db) return _db;
  const [items, recipes, variations] = await Promise.all([
    fetch('/data/items.csv').then(r => r.text()),
    fetch('/data/recipes.csv').then(r => r.text()),
    fetch('/data/variations.csv').then(r => r.text()),
  ]);
  const varSet = new Set(variations.split('\n').slice(1).map(l => l.split(' ; ')[0]?.trim().toUpperCase()).filter(Boolean));
  _db = { items: parseDB(items), recipes: parseDB(recipes), varSet };
  return _db;
}

const EMPTY = 'FFFE';
function parseSlot(hex) {
  if (!hex || hex.length < 16) return null;
  const idB = hex.slice(0, 8), cntB = hex.slice(8, 16);
  const itemId = (idB[6]+idB[7] + idB[4]+idB[5] + idB[2]+idB[3] + idB[0]+idB[1]).slice(-4).toUpperCase();
  const variation = parseInt(idB[4] + idB[5], 16) || 0;
  const raw = parseInt(cntB[6]+cntB[7]+cntB[4]+cntB[5]+cntB[2]+cntB[3]+cntB[0]+cntB[1], 16);
  return { itemId, count: itemId !== EMPTY ? raw + 1 : 0, variation };
}
const hexA = (n) => '0x' + n.toString(16).toUpperCase();
const u32le = (n) => { const h = (n >>> 0).toString(16).padStart(8, '0'); return h[6]+h[7]+h[4]+h[5]+h[2]+h[3]+h[0]+h[1]; };
const readU32 = (h) => parseInt(h.slice(6,8)+h.slice(4,6)+h.slice(2,4)+h.slice(0,2), 16);

function ItemIcon({ internal, color, sprites }) {
  const [broken, setBroken] = useState(false);
  const swatch = COLOR_HEX[color] || COLOR_HEX.None;
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="absolute inset-2 rounded-sm" style={{ background: swatch }} />
      {sprites && internal && !broken && (
        <img src={`https://acnhcdn.com/latest/MenuIcon/${internal}.png`} alt="" draggable={false}
             onError={() => setBroken(true)} className="relative max-w-[88%] max-h-[88%] object-contain" />
      )}
    </span>
  );
}

function Toggle({ on, onClick, label }) {
  return (
    <button className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0" onClick={onClick} type="button">
      {label && <span className="text-xs">{label}</span>}
      <span className={`pk-toggle ${on ? 'pk-on' : ''}`} />
    </button>
  );
}

/* tab → { base resolver, slot count, addressing } */
const GRID_TABS = ['Inventory', 'Storage', 'Recycling'];
const LEFT_TABS = ['Inventory', 'Storage', 'Recycling', 'Turnips', 'Weather', 'Cheats'];
const BOTTOM_TABS = ['Item', 'Recipe', 'Variation'];

function slotAddr(tab, idx) {
  if (tab === 'Inventory') {
    const base = getItemSlotBase() ?? ADDR.ItemSlotBase;
    return getSlotAddress(idx + 1, base);
  }
  if (tab === 'Storage')   return ADDR.HomeStorageBase + idx * 8;
  if (tab === 'Recycling') return ADDR.RecyclingBase   + idx * 8;
  return 0;
}
function slotCount(tab) { return tab === 'Recycling' ? 20 : 40; }

export default function PokerUI({ connected, connecting, host, setHost, onConnect, onDisconnect, error, useSprites = true, langIdx = 9, setLangIdx }) {
  const [db, setDb]           = useState({ items: [], recipes: [], varSet: new Set() });
  const [dbReady, setDbReady] = useState(false);
  const [leftTab, setLeftTab] = useState('Inventory');
  const [botTab, setBotTab]   = useState('Item');
  const [slots, setSlots]     = useState(Array(40).fill(null));
  const [selected, setSelected] = useState(null);
  const [itemId, setItemId]   = useState('');
  const [amount, setAmount]   = useState('1');
  const [hexMode, setHexMode] = useState(false);
  const [search, setSearch]   = useState('');
  const [retain, setRetain]   = useState(true);
  const [autoRefresh, setAuto]= useState(false);
  const [status, setStatus]   = useState('');
  const [busy, setBusy]       = useState(false);
  const [hovName, setHovName] = useState('');
  const autoTimer = useRef(null);

  const isGrid = GRID_TABS.includes(leftTab);
  const t = makeT(langIdx);

  useEffect(() => { loadDB().then(d => { setDb(d); setDbReady(true); }); }, []);

  const lang = LANGS.find(l => l.idx === langIdx) || LANGS[0];
  const nameOf = useCallback((it) => (it?.names?.[lang.idx] || it?.names?.[2] || it?.id || ''), [lang]);

  const allById = useMemo(() => {
    const m = new Map();
    for (const it of db.items)   m.set(it.id.toUpperCase(), it);
    for (const it of db.recipes) if (!m.has(it.id.toUpperCase())) m.set(it.id.toUpperCase(), it);
    return m;
  }, [db]);

  const listSource = useMemo(() => {
    if (botTab === 'Recipe')    return db.recipes;
    if (botTab === 'Variation') return db.items.filter(i => db.varSet.has(i.id.toUpperCase()));
    return db.items;
  }, [botTab, db]);

  const filtered = useMemo(() => {
    if (!search.trim()) return listSource.slice(0, 400);
    const q = search.toLowerCase();
    return listSource.filter(i => nameOf(i).toLowerCase().includes(q) || i.id.toLowerCase().includes(q)).slice(0, 400);
  }, [search, listSource, nameOf]);

  /* ── reading slot-based tabs ─────────────────────────────────────── */
  const refresh = useCallback(async () => {
    if (!connected || !isGrid) return;
    setBusy(true); setStatus('Reading…');
    const n = slotCount(leftTab);
    const next = Array(n).fill(null);
    try {
      if (leftTab === 'Inventory') {
        const base = getItemSlotBase() ?? ADDR.ItemSlotBase;
        const [r1, r2] = await Promise.all([
          window.sysbot.peek(hexA(getSlotAddress(1, base)), 160),
          window.sysbot.peek(hexA(getSlotAddress(21, base)), 160),
        ]);
        if (r1.ok) for (let i = 0; i < 20; i++) next[i]      = parseSlot(r1.data.slice(i*16, i*16+16));
        if (r2.ok) for (let i = 0; i < 20; i++) next[20 + i] = parseSlot(r2.data.slice(i*16, i*16+16));
      } else {
        const start = slotAddr(leftTab, 0);
        const r = await window.sysbot.peek(hexA(start), n * 8);
        if (r.ok) for (let i = 0; i < n; i++) next[i] = parseSlot(r.data.slice(i*16, i*16+16));
      }
      setSlots(next); setStatus('');
    } catch (e) { setStatus('Error: ' + e.message); }
    setBusy(false);
  }, [connected, isGrid, leftTab]);

  useEffect(() => { if (connected && isGrid) refresh(); else if (isGrid) setSlots(Array(slotCount(leftTab)).fill(null)); }, [connected, leftTab]); // eslint-disable-line

  useEffect(() => {
    clearInterval(autoTimer.current);
    if (autoRefresh && connected && isGrid) autoTimer.current = setInterval(refresh, 2500);
    return () => clearInterval(autoTimer.current);
  }, [autoRefresh, connected, isGrid, refresh]);

  /* ── item selection / writing ────────────────────────────────────── */
  const pick = useCallback((it) => {
    setSelected(it); setItemId(it.id.toUpperCase()); setHovName(nameOf(it));
    if (!retain) setAmount('1');
  }, [nameOf, retain]);

  const currentBytes = useCallback(() => {
    const id = (itemId || selected?.id || EMPTY).replace(/^0x/i, '').toUpperCase();
    let qty = parseInt(amount, hexMode ? 16 : 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    return buildItemBytes(id, qty, 0);
  }, [itemId, selected, amount, hexMode]);

  const writeSlot = useCallback((idx, bytes) => window.sysbot.poke(hexA(slotAddr(leftTab, idx)), bytes), [leftTab]);

  const injectSlot = useCallback(async (idx) => {
    if (!connected) return;
    if (!itemId && !selected) { setStatus(t('pickItem')); return; }
    const res = await writeSlot(idx, currentBytes());
    if (res.ok) {
      const id = (itemId || selected.id).toUpperCase();
      setSlots(s => { const n = [...s]; n[idx] = { itemId: id, count: parseInt(amount, hexMode?16:10) || 1, variation: 0 }; return n; });
      setStatus(`Slot ${idx + 1} ✓`);
    } else setStatus('Error: ' + res.error);
    setTimeout(() => setStatus(''), 1600);
  }, [connected, itemId, selected, currentBytes, writeSlot, amount, hexMode]);

  const clearSlot = useCallback(async (idx) => {
    if (!connected) return;
    const res = await writeSlot(idx, buildItemBytes(EMPTY, 0));
    if (res.ok) setSlots(s => { const n = [...s]; n[idx] = { itemId: EMPTY, count: 0, variation: 0 }; return n; });
  }, [connected, writeSlot]);

  const spawnAll = useCallback(async () => {
    if (!connected || (!itemId && !selected)) return;
    setBusy(true); setStatus('Spawn All…');
    const bytes = currentBytes();
    for (let i = 0; i < slotCount(leftTab); i++) await writeSlot(i, bytes);
    await refresh(); setStatus('Filled all slots ✓'); setBusy(false);
    setTimeout(() => setStatus(''), 1600);
  }, [connected, itemId, selected, currentBytes, writeSlot, refresh, leftTab]);

  const fillRemain = useCallback(async () => {
    if (!connected || (!itemId && !selected)) return;
    setBusy(true); setStatus('Fill Remain…');
    const bytes = currentBytes();
    for (let i = 0; i < slotCount(leftTab); i++) { const s = slots[i]; if (!s || s.itemId === EMPTY) await writeSlot(i, bytes); }
    await refresh(); setStatus('Filled empty slots ✓'); setBusy(false);
    setTimeout(() => setStatus(''), 1600);
  }, [connected, itemId, selected, currentBytes, writeSlot, refresh, slots, leftTab]);

  const clearAll = useCallback(async () => {
    if (!connected) return;
    setBusy(true); setStatus('Clear All…');
    const bytes = buildItemBytes(EMPTY, 0);
    for (let i = 0; i < slotCount(leftTab); i++) await writeSlot(i, bytes);
    await refresh(); setStatus('Cleared ✓'); setBusy(false);
    setTimeout(() => setStatus(''), 1600);
  }, [connected, writeSlot, refresh, leftTab]);

  /* ── render ──────────────────────────────────────────────────────── */
  return (
    <div className="pk-root flex flex-col h-screen overflow-hidden select-none">

      <div className="flex items-center px-3 h-7 text-xs shrink-0"
           style={{ background: 'var(--pk-titlebar)', color: 'var(--pk-on-green)', WebkitAppRegion: 'drag' }}>
        <span className="font-semibold tracking-wide">NHLE — New Horizons Live Editor</span>
        <span className="opacity-70 ml-2">| {t('subtitleVerified') || 'ACNH 3.0.3'}</span>
        <div className="ml-auto flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
          <button title="—" onClick={() => window.sysbot?.minimize?.()}
                  className="w-6 h-5 rounded text-sm leading-none hover:bg-white/20">–</button>
          <button title="✕" onClick={() => window.sysbot?.quit?.()}
                  className="w-6 h-5 rounded text-sm leading-none hover:bg-red-500/80">✕</button>
        </div>
      </div>

      {/* toolbar — only certified controls */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: 'var(--pk-titlebar2)', color: 'var(--pk-on-green)' }}>
        <button className="pk-btn" style={{ minWidth: 92 }} onClick={connected ? onDisconnect : onConnect} disabled={connecting}>
          {connecting ? '…' : connected ? t('disconnect') : t('connect')}
        </button>
        <input className="pk-ipbox" style={{ width: 150 }} value={host} onChange={e => setHost(e.target.value)} disabled={connected} spellCheck={false} />
        <span className="flex items-center gap-1.5 text-xs font-semibold ml-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: connected ? '#a6ff7a' : '#d8d0a0' }} />
          {connected ? t('connected') : t('offline')}
        </span>

        {isGrid && (
          <>
            <button className="pk-btn ml-2" disabled={!connected || busy} onClick={refresh}>{busy ? '…' : t('refresh')}</button>
            <Toggle on={autoRefresh} onClick={() => setAuto(a => !a)} label={t('auto')} />
          </>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {isGrid && (
            <input className="pk-input" style={{ width: 200 }} placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} />
          )}
          <select className="pk-select" value={langIdx} onChange={e => setLangIdx(Number(e.target.value))}>
            {LANGS.map(l => <option key={l.idx} value={l.idx}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="px-3 py-1 text-xs shrink-0" style={{ background: '#5a2a2a', color: '#ffd4d4' }}>{error}</div>}

      {/* body */}
      <div className="flex flex-1 overflow-hidden">

        {/* vertical tabs (all certified) */}
        <div className="flex flex-col shrink-0">
          {LEFT_TABS.map(tab => (
            <button key={tab} className={`pk-vtab flex-1 ${leftTab === tab ? 'pk-on' : ''}`} onClick={() => setLeftTab(tab)}>{t('tab_' + tab)}</button>
          ))}
        </div>

        {/* center column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {isGrid && (
            <GridView slots={slots} leftTab={leftTab} allById={allById} nameOf={nameOf} t={t}
                      useSprites={useSprites} injectSlot={injectSlot} clearSlot={clearSlot} setHovName={setHovName} />
          )}
          {leftTab === 'Turnips' && <TurnipsPanel connected={connected} t={t} />}
          {leftTab === 'Weather' && <WeatherPanel connected={connected} t={t} />}
          {leftTab === 'Cheats'  && <CheatsPanel connected={connected} t={t} />}

          {/* bottom item bar (grid tabs only) */}
          {isGrid && (
            <div className="mt-auto p-2 shrink-0" style={{ background: 'var(--pk-panel)' }}>
              <div className="flex gap-1 mb-2">
                {BOTTOM_TABS.map(bt => (
                  <button key={bt} className={`pk-btn ${botTab === bt ? 'pk-on' : ''}`} onClick={() => { setBotTab(bt); setSearch(''); }}>{t('bottom_' + bt)}</button>
                ))}
              </div>
              <div className="flex items-end gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] opacity-80">{t('itemId')}</span>
                  <input className="pk-input font-mono" style={{ width: 110 }} value={itemId} onChange={e => setItemId(e.target.value.toUpperCase())} placeholder="0000" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] opacity-80">{t('amount')}</span>
                  <input className="pk-input font-mono" style={{ width: 110 }} value={amount} onChange={e => setAmount(e.target.value)} placeholder={hexMode ? 'hex' : 'dec'} />
                </div>
                <button className={`pk-btn ${hexMode ? 'pk-on' : ''}`} onClick={() => setHexMode(h => !h)}>{t('hexMode')}</button>
                <Toggle on={retain} onClick={() => setRetain(r => !r)} label={t('retainName')} />
                <div className="flex gap-1 ml-auto">
                  <button className="pk-btn" disabled={!connected} onClick={fillRemain}>{t('fillRemain')}</button>
                  <button className="pk-btn" disabled={!connected} onClick={spawnAll}>{t('spawnAll')}</button>
                  <button className="pk-btn" disabled={!connected} onClick={clearAll}>{t('clearAll')}</button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[12px] font-bold" style={{ color: 'var(--pk-green)' }}>{hovName || t('itemName')}</span>
                {status && <span className="text-[11px] ml-auto opacity-80">{status}</span>}
              </div>
            </div>
          )}
        </div>

        {/* right item list (grid tabs only) */}
        {isGrid && (
          <div className="flex flex-col shrink-0" style={{ width: 340, background: 'var(--pk-panel)' }}>
            <div className="flex text-[12px] font-semibold px-2 py-1 shrink-0" style={{ background: 'var(--pk-row-hd)', color: 'var(--pk-on-green)' }}>
              <span className="flex-1">{t('colName')}</span>
              <span style={{ width: 56 }} className="text-center">{t('colImage')}</span>
            </div>
            <div className="flex-1 overflow-auto">
              {!dbReady && <div className="text-center text-xs opacity-60 py-6">{t('loadingDb')}</div>}
              {filtered.map((it, n) => (
                <div key={it.id} onClick={() => pick(it)} onMouseEnter={() => setHovName(nameOf(it))}
                     className="flex items-center px-2 cursor-pointer text-[12px]"
                     style={{ height: 30, background: selected?.id === it.id ? 'var(--pk-row-sel)' : (n % 2 ? 'var(--pk-row-alt)' : 'var(--pk-row)') }}>
                  <span className="flex-1 truncate">{nameOf(it)}</span>
                  <span className="flex items-center justify-center" style={{ width: 56, height: 28 }}>
                    <span className="relative block" style={{ width: 26, height: 26 }}>
                      <ItemIcon internal={it.internal} color={it.color} sprites={useSprites} />
                    </span>
                  </span>
                </div>
              ))}
              {dbReady && filtered.length === 0 && <div className="text-center text-xs opacity-60 py-6">{t('noResults')}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── grid view ──────────────────────────────────────────────────────── */
function GridView({ slots, leftTab, allById, nameOf, useSprites, injectSlot, clearSlot, setHovName, t }) {
  return (
    <div className="p-2 overflow-auto">
      <div className="text-[11px] mb-1.5 opacity-70 font-semibold">
        {t('tab_' + leftTab)} · {slots.length} {t('slots')} · {t('gridHint')}
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(8, minmax(74px, 1fr))' }}>
        {slots.map((slot, i) => {
          const empty = !slot || slot.itemId === EMPTY;
          const it = empty ? null : allById.get(slot.itemId);
          const label = empty ? '' : (it ? nameOf(it) : slot.itemId);
          return (
            <div key={i} className={`pk-slot ${empty ? 'pk-empty' : ''}`} style={{ height: 92 }}
                 onClick={() => injectSlot(i)} onContextMenu={e => { e.preventDefault(); clearSlot(i); }}
                 onMouseEnter={() => !empty && setHovName(`${label}${slot.count > 1 ? ' ×' + slot.count : ''}`)}
                 title={empty ? `Slot ${i+1} (empty)` : `Slot ${i+1}: ${label}  ×${slot.count}`}>
              {!empty && <ItemIcon internal={it?.internal} color={it?.color} sprites={useSprites} />}
              {!empty && (
                <span className="absolute bottom-0 inset-x-0 text-center text-[11px] font-bold leading-4 px-0.5 truncate"
                      style={{ background: 'rgba(92,74,48,0.6)', color: '#fff' }}>
                  {slot.count > 1 ? slot.count : `Dur: ${Math.max(0, slot.count - 1)}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Turnips (TurnipBuyPrice / TurnipSellBase ✓ confirmed 3.0.3) ─────── */
function TurnipsPanel({ connected, t }) {
  const [prices, setPrices] = useState(null);
  const [buyEdit, setBuyEdit] = useState('');
  const [status, setStatus] = useState('');

  const read = useCallback(async () => {
    if (!connected) return;
    const [b, s] = await Promise.all([
      window.sysbot.peek(hexA(ADDR.TurnipBuyPrice), 4),
      window.sysbot.peek(hexA(ADDR.TurnipSellBase), 48),
    ]);
    if (!b.ok || !s.ok) { setStatus('Error reading'); return; }
    const sell = []; for (let i = 0; i < 12; i++) sell.push(readU32(s.data.slice(i*8, i*8+8)));
    setPrices({ buy: readU32(b.data), sell }); setStatus('');
  }, [connected]);

  useEffect(() => { if (connected) read(); }, [connected, read]);

  const writeBuy = async () => {
    const v = parseInt(buyEdit);
    if (isNaN(v) || v < 90 || v > 110) { setStatus('Buy price 90–110'); return; }
    const r = await window.sysbot.poke(hexA(ADDR.TurnipBuyPrice), '0x' + u32le(v));
    setStatus(r.ok ? 'Buy price set ✓' : 'Error'); read();
  };
  const writeSell = async (idx, val) => {
    const n = parseInt(val); if (isNaN(n) || n < 1 || n > 999) return;
    const r = await window.sysbot.poke(hexA(ADDR.TurnipSellBase + idx * 4), '0x' + u32le(n));
    if (r.ok) setPrices(p => { const c = { ...p, sell: [...p.sell] }; c.sell[idx] = n; return c; });
  };
  const maxAll = async () => {
    for (let i = 0; i < 12; i++) await window.sysbot.poke(hexA(ADDR.TurnipSellBase + i * 4), '0x' + u32le(660));
    await read(); setStatus('All sell prices → 660 ✓');
  };

  return (
    <div className="p-4 overflow-auto" style={{ background: 'var(--pk-panel)', flex: 1 }}>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-extrabold text-base">{t('turnipPrices')}</h3>
        <button className="pk-btn" disabled={!connected} onClick={read}>{t('read')}</button>
        {status && <span className="text-xs opacity-80">{status}</span>}
      </div>
      {!prices ? (
        <p className="text-sm opacity-70">{connected ? t('searching') : t('connectFirst')}</p>
      ) : (
        <div className="max-w-md space-y-3">
          <div className="pk-card p-3 flex items-center gap-3" style={{ borderWidth: 2 }}>
            <span className="text-xs opacity-70">{t('buyDaisy')}</span>
            <span className="text-2xl font-extrabold" style={{ color: 'var(--pk-green)' }}>{prices.buy}</span>
            <input className="pk-input ml-auto" style={{ width: 80 }} placeholder="90-110" value={buyEdit} onChange={e => setBuyEdit(e.target.value)} />
            <button className="pk-btn" disabled={!connected} onClick={writeBuy}>{t('set')}</button>
          </div>
          <div className="pk-card p-3" style={{ borderWidth: 2 }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-70 font-bold">{t('sellPrices')}</span>
              <button className="pk-btn" disabled={!connected} onClick={maxAll}>{t('maxAll')}</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TURNIP_DAYS.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg" style={{ background: '#fffdf4', border: '1px solid var(--pk-slot-bd)' }}>
                  <span className="text-xs opacity-70 w-16">{d}</span>
                  <input className="pk-input font-mono" style={{ width: 70 }} defaultValue={prices.sell[i]}
                         onBlur={e => writeSell(i, e.target.value)} onKeyDown={e => e.key === 'Enter' && e.target.blur()} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Cheats (FreezeTime [MAIN] ✓ confirmed 3.0.3) ────────────────────── */
function CheatsPanel({ connected, t }) {
  const [active, setActive] = useState({});
  const [status, setStatus] = useState('');
  const pm = (addr, val) => window.sysbot.pokeMain(hexA(addr), '0x' + val);

  const setTime = async (frz) => {
    await pm(ADDR.FreezeTime, frz ? PHYSICS.freezeTime : PHYSICS.unfreezeTime);
    setActive(a => ({ ...a, time: frz }));
    setStatus(frz ? `${t('freezeTime')} ✓` : '—'); setTimeout(() => setStatus(''), 2000);
  };

  return (
    <div className="p-4 overflow-auto" style={{ background: 'var(--pk-panel)', flex: 1 }}>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-extrabold text-base">{t('tab_Cheats')}</h3>
        <span className="text-[11px] opacity-60">{t('cheatsRegion')}</span>
        {status && <span className="text-xs ml-auto" style={{ color: 'var(--pk-green)' }}>{status}</span>}
      </div>
      <div className="max-w-md">
        <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg" style={{ background: '#fffdf4', border: '1px solid var(--pk-slot-bd)' }}>
          <div>
            <div className="font-bold text-sm">{t('freezeTime')}</div>
            <div className="text-[11px] opacity-60">{t('freezeTimeDesc')}</div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button className={`pk-btn ${active.time ? 'pk-on' : ''}`} disabled={!connected} onClick={() => setTime(true)}>{t('on')}</button>
            <button className="pk-btn" disabled={!connected} onClick={() => setTime(false)} style={{ background: '#d98a6a', borderColor: '#a85a3a' }}>{t('off')}</button>
          </div>
        </div>
        <p className="text-[11px] opacity-55 mt-2">{t('moreCheats')}</p>
      </div>
    </div>
  );
}

/* ── Weather (forecast engine ported from MeteoNook + WeatherSeed write ✓) ─ */
const WEATHER_CELL = ['#bfe3ff', '#ffe9a8', '#d8d6cb', '#aab6c4', '#7fa8d8', '#52719f'];
function WeatherPanel({ connected, t }) {
  const [hemi, setHemi]   = useState(HEMI.Northern);
  const [year, setYear]   = useState(2026);
  const [month, setMonth] = useState(6);
  const [day, setDay]     = useState(24);
  const [target, setTarget] = useState('shower');
  const [current, setCurrent] = useState(null);
  const [result, setResult]   = useState(null);
  const [busy, setBusy]   = useState(false);
  const [status, setStatus] = useState('');

  const readCurrent = useCallback(async () => {
    if (!connected) return;
    const r = await window.sysbot.peek(hexA(ADDR.WeatherSeed), 4);
    if (r.ok) setCurrent(readU32(r.data));
  }, [connected]);
  useEffect(() => { readCurrent(); }, [readCurrent]);

  const writeSeed = async (seed) => {
    const r = await window.sysbot.poke(hexA(ADDR.WeatherSeed), '0x' + u32le(seed >>> 0));
    return r.ok;
  };

  const find = () => {
    const feas = targetFeasibility(hemi, year, month, day, target);
    if (feas) { setResult(null); setStatus(t('feas_' + feas)); return; }
    setBusy(true); setStatus(t('searchingSeed')); setResult(null);
    setTimeout(async () => {
      const r = findSeed(hemi, year, month, day, target, { maxTries: 3_000_000 });
      if (!r) { setBusy(false); setStatus(t('noSeed')); return; }
      const ok = connected ? await writeSeed(r.seed) : false;
      setResult({ seed: r.seed, info: r.info });
      setCurrent(connected ? r.seed : current);
      setBusy(false);
      setStatus(connected ? (ok ? t('seedApplied') : '✗') : t('foundConnect'));
    }, 20);
  };

  const restore = async () => {
    if (current == null || !connected) return;
    const ok = await writeSeed(current);
    setStatus(ok ? t('seedApplied') : '✗');
  };

  const info = result?.info;
  const snow = info?.snow;
  const W_KEYS = ['w_Clear', 'w_Sunny', 'w_Cloudy', 'w_RainClouds', 'w_Rain', 'w_HeavyRain'];
  const cellName = (w) => (snow && (w === 4 || w === 5 || w === 3)) ? t('w_Snow') : t(W_KEYS[w]);

  return (
    <div className="p-4 overflow-auto" style={{ background: 'var(--pk-panel)', flex: 1 }}>
      <div className="flex items-center gap-3 mb-1">
        <h3 className="font-extrabold text-base">{t('tab_Weather')}</h3>
        <span className="text-[11px] opacity-60">{t('weatherSub')}</span>
      </div>
      <p className="text-[11px] opacity-60 mb-3 max-w-xl">{t('weatherIntro')}</p>

      <div className="flex flex-wrap items-end gap-3 mb-3 max-w-2xl">
        <label className="flex flex-col gap-1 text-[11px] opacity-80">{t('hemisphere')}
          <select className="pk-select" value={hemi} onChange={e => setHemi(Number(e.target.value))}>
            <option value={HEMI.Northern}>{t('northern')}</option>
            <option value={HEMI.Southern}>{t('southern')}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] opacity-80">{t('year')}
          <input className="pk-input" style={{ width: 70 }} type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] opacity-80">{t('month')}
          <input className="pk-input" style={{ width: 56 }} type="number" min="1" max="12" value={month} onChange={e => setMonth(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] opacity-80">{t('day')}
          <input className="pk-input" style={{ width: 56 }} type="number" min="1" max="31" value={day} onChange={e => setDay(Number(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] opacity-80">{t('weatherLabel')}
          <select className="pk-select" value={target} onChange={e => setTarget(e.target.value)}>
            {TARGETS.map(tg => <option key={tg.id} value={tg.id}>{tg.emoji} {t('target_' + tg.id)}</option>)}
          </select>
        </label>
        <button className="pk-btn" style={{ padding: '8px 16px' }} disabled={busy} onClick={find}>
          {busy ? t('searching') : t('findApply')}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3 text-[12px]">
        <span className="opacity-70">{t('currentSeed')}</span>
        <span className="font-mono font-bold">{current == null ? '—' : current}</span>
        <button className="pk-btn" disabled={!connected || current == null} onClick={readCurrent}>{t('read')}</button>
        {result && <button className="pk-btn" disabled={!connected} onClick={restore} style={{ background: '#fffdf4', color: 'var(--pk-text)' }}>{t('restorePrev')}</button>}
      </div>

      {status && <div className="text-[12px] mb-2" style={{ color: status.includes('✓') ? 'var(--pk-green)' : 'inherit' }}>{status}</div>}

      {info && (
        <div className="pk-card p-3 max-w-2xl" style={{ borderWidth: 2 }}>
          <div className="flex items-center gap-2 mb-2 font-bold">
            <span>{t('seed')}</span><span className="font-mono">{result.seed}</span>
            <span className="opacity-60 font-normal">· {year}-{String(month).padStart(2,'0')}-{String(day).padStart(2,'0')}</span>
          </div>

          {info.event === 'shower' && (
            <div className="text-[12px] mb-2" style={{ color: 'var(--pk-green)' }}>
              🌠 {t('meteorShower')} — {info.stars.length} {t('starMinutes')}.{' '}
              {info.stars.slice(0, 6).map(s => `${String(s.hour).padStart(2,'0')}:${String(s.minute).padStart(2,'0')}`).join(', ')}
              {info.stars.length > 6 ? '…' : ''}
            </div>
          )}
          {info.event === 'rainbow' && (
            <div className="text-[12px] mb-2" style={{ color: 'var(--pk-green)' }}>
              🌈 {info.rainbow.count === 2 ? t('doubleRainbow') : t('target_rainbow')} · {t('rainbowAround')} {info.rainbow.hour}:00
            </div>
          )}
          {info.event === 'aurora' && (
            <div className="text-[12px] mb-2" style={{ color: 'var(--pk-green)' }}>🌌 {t('auroraNight')}</div>
          )}

          {/* hourly strip */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(24, 1fr)', gap: 2 }}>
            {info.weather.map((w, h) => (
              <div key={h} title={`${String(h).padStart(2,'0')}:00 — ${cellName(w)}`}
                   className="flex flex-col items-center">
                <div style={{ height: 22, width: '100%', background: WEATHER_CELL[w], borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)' }} />
                <span className="text-[8px] opacity-60 mt-0.5">{h}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] opacity-60 mt-2">{t('hourlyHint')}</div>
        </div>
      )}
    </div>
  );
}
