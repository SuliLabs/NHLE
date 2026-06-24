import { useState, useEffect, useCallback, useMemo } from 'react';
import { ADDR, getSlotAddress, buildItemBytes, parseItemsCSV, parseRecipesCSV, parseVariationsCSV } from '../data/acnh.js';
import { getItemSlotBase, setItemSlotBase, clearItemSlotBase } from '../data/overrides.js';

let _items = null;
let _recipes = null;
let _variationIds = null;

async function loadItems() {
  if (_items) return _items;
  const [ir, rr, vr] = await Promise.all([
    fetch('/data/items.csv'),
    fetch('/data/recipes.csv'),
    fetch('/data/variations.csv'),
  ]);
  const [it, rt, vt] = await Promise.all([ir.text(), rr.text(), vr.text()]);
  _items       = parseItemsCSV(it);
  _recipes     = parseRecipesCSV(rt);
  _variationIds = parseVariationsCSV(vt);
  return _items;
}

// Reads 8 bytes from sys-botbase peek response (hex string, memory order)
// count in memory is 0-indexed (quantity - 1); we convert back to human-facing here
function parseSlot(hex) {
  if (!hex || hex.length < 16) return { itemId: 'FFFE', count: 0, variation: 0 };
  const idBytes  = hex.slice(0, 8);
  const cntBytes = hex.slice(8, 16);
  const itemId = (idBytes[6]+idBytes[7] + idBytes[4]+idBytes[5] + idBytes[2]+idBytes[3] + idBytes[0]+idBytes[1])
                   .slice(-4).toUpperCase();
  const variation = parseInt(idBytes[4]+idBytes[5], 16) || 0;
  const countRaw = parseInt(cntBytes[6]+cntBytes[7]+cntBytes[4]+cntBytes[5]+cntBytes[2]+cntBytes[3]+cntBytes[0]+cntBytes[1], 16);
  const count = itemId !== 'FFFE' ? countRaw + 1 : 0;
  return { itemId, count, variation };
}

const EMPTY_ID = 'FFFE';

function effectiveBase(player, customBase) {
  const base = customBase !== null ? customBase : (getItemSlotBase() ?? ADDR.ItemSlotBase);
  return base + (player - 1) * ADDR.PlayerOffset;
}

export default function ACNHInventory({ connected }) {
  const [items, setItems]           = useState([]);
  const [recipes, setRecipes]       = useState([]);
  const [variationIds, setVarIds]   = useState(new Set());
  const [slots, setSlots]           = useState(Array(40).fill(null));
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [count, setCount]           = useState('1');
  const [variation, setVariation]   = useState(0);
  const [status, setStatus]         = useState('');
  const [dbReady, setDbReady]       = useState(false);
  const [tab, setTab]               = useState('items');
  const [player, setPlayer]         = useState(1);
  // null = use stored/default; Number = manual override (hex)
  const [customBase, setCustomBase] = useState(null);
  const [baseInput, setBaseInput]   = useState('');
  const [editingBase, setEditingBase] = useState(false);

  useEffect(() => {
    loadItems().then(its => {
      setItems(its);
      setRecipes(_recipes);
      setVarIds(_variationIds);
      setDbReady(true);
    });
  }, []);

  // Reset variation when item changes
  useEffect(() => { setVariation(0); }, [selected]);

  const selectedHasVariation = selected && variationIds.has(selected.id.toUpperCase());

  const filtered = useMemo(() => {
    const db = tab === 'recipes' ? recipes : items;
    if (!search.trim()) return db.slice(0, 100);
    const q = search.toLowerCase();
    return db.filter(i => i.eng.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)).slice(0, 100);
  }, [search, items, recipes, tab]);

  const getBase = useCallback(() => effectiveBase(player, customBase), [player, customBase]);

  const readInventory = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    setStatus('Reading...');
    const base = getBase();
    const newSlots = Array(40).fill(null);
    const [r1, r2] = await Promise.all([
      window.sysbot.peek(`0x${getSlotAddress(1, base).toString(16).toUpperCase()}`, 160),
      window.sysbot.peek(`0x${getSlotAddress(21, base).toString(16).toUpperCase()}`, 160),
    ]);
    if (r1.ok) {
      for (let i = 0; i < 20; i++)
        newSlots[i] = parseSlot(r1.data.slice(i * 16, i * 16 + 16));
    }
    if (r2.ok) {
      for (let i = 0; i < 20; i++)
        newSlots[20 + i] = parseSlot(r2.data.slice(i * 16, i * 16 + 16));
    }
    setSlots(newSlots);
    setLoading(false);
    setStatus('');
  }, [connected, getBase]);

  const injectSlot = useCallback(async (slotIdx) => {
    if (!connected || !selected) return;
    const addr = `0x${getSlotAddress(slotIdx + 1, getBase()).toString(16).toUpperCase()}`;
    const bytes = buildItemBytes(selected.id, parseInt(count) || 1, variation);
    const res = await window.sysbot.poke(addr, bytes);
    if (res.ok) {
      setStatus(`Slot ${slotIdx + 1}: ${selected.eng} ✓`);
      setSlots(s => {
        const n = [...s];
        n[slotIdx] = { itemId: selected.id.toUpperCase(), count: parseInt(count) || 1, variation };
        return n;
      });
    } else {
      setStatus('Error: ' + res.error);
    }
    setTimeout(() => setStatus(''), 2000);
  }, [connected, selected, count, variation, getBase]);

  const deleteSlot = useCallback(async (slotIdx) => {
    if (!connected) return;
    const addr = `0x${getSlotAddress(slotIdx + 1, getBase()).toString(16).toUpperCase()}`;
    const bytes = buildItemBytes(EMPTY_ID, 0);
    const res = await window.sysbot.poke(addr, bytes);
    if (res.ok) {
      setSlots(s => {
        const n = [...s];
        n[slotIdx] = { itemId: EMPTY_ID, count: 0, variation: 0 };
        return n;
      });
    }
  }, [connected, getBase]);

  const injectAll = useCallback(async () => {
    if (!connected || !selected) return;
    setStatus('Injecting all slots...');
    const bytes = buildItemBytes(selected.id, parseInt(count) || 1, variation);
    const base = getBase();
    for (let i = 0; i < 40; i++) {
      const addr = `0x${getSlotAddress(i + 1, base).toString(16).toUpperCase()}`;
      await window.sysbot.poke(addr, bytes);
    }
    await readInventory();
    setStatus(`All 40 slots: ${selected.eng} ✓`);
    setTimeout(() => setStatus(''), 3000);
  }, [connected, selected, count, variation, getBase, readInventory]);

  const itemName = (slot) => {
    if (!slot || slot.itemId === EMPTY_ID) return '—';
    const found = items.find(i => i.id.toUpperCase() === slot.itemId) ||
                  recipes.find(i => i.id.toUpperCase() === slot.itemId);
    return found?.eng ?? slot.itemId;
  };

  // Displayed base address
  const displayBase = () => {
    const b = customBase !== null ? customBase : (getItemSlotBase() ?? ADDR.ItemSlotBase);
    return '0x' + b.toString(16).toUpperCase();
  };

  const commitBase = () => {
    const val = baseInput.replace(/^0x/i, '');
    const n = parseInt(val, 16);
    if (!isNaN(n) && n > 0) {
      setCustomBase(n);
      setItemSlotBase(n);
    }
    setEditingBase(false);
  };

  const resetBase = () => {
    setCustomBase(null);
    clearItemSlotBase();
    setBaseInput('');
    setEditingBase(false);
  };

  return (
    <div className="space-y-3 max-w-4xl">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Player selector */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">Player</span>
          <select
            value={player}
            onChange={e => setPlayer(Number(e.target.value))}
            className="bg-black border border-gray-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-700"
          >
            {[1,2,3,4,5,6,7,8].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Base address */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">Base</span>
          {editingBase ? (
            <>
              <input
                autoFocus
                value={baseInput}
                onChange={e => setBaseInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitBase(); if (e.key === 'Escape') setEditingBase(false); }}
                placeholder="0xB27BB758"
                className="w-32 px-2 py-1 rounded bg-black border border-cyan-700 text-cyan-300 text-xs font-mono focus:outline-none"
              />
              <button onClick={commitBase} className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-700 text-cyan-400 hover:bg-cyan-900/30">Set</button>
              <button onClick={resetBase} className="text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-400 hover:bg-gray-900">Reset</button>
            </>
          ) : (
            <button
              onClick={() => { setBaseInput(displayBase()); setEditingBase(true); }}
              className="font-mono text-xs text-gray-400 hover:text-cyan-400 transition-colors"
              title="Click to override base address"
            >
              {displayBase()}
              {customBase !== null && <span className="ml-1 text-amber-500">*</span>}
            </button>
          )}
        </div>

        <div className="ml-auto">
          <button
            onClick={readInventory}
            disabled={!connected || loading}
            className="px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400
                       hover:bg-cyan-900/30 transition-colors disabled:opacity-30"
          >
            {loading ? 'Reading…' : 'Read Inventory'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Item search */}
        <div className="space-y-2">
          <div className="flex gap-1 mb-1">
            {['items','recipes'].map(t => (
              <button key={t} onClick={() => { setTab(t); setSearch(''); setSelected(null); }}
                className={`px-2 py-0.5 text-xs rounded border ${tab === t ? 'border-cyan-700 text-cyan-300 bg-cyan-900/30' : 'border-gray-800 text-gray-500'}`}>
                {t === 'items' ? 'Items' : 'Recipes'}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={dbReady ? `Search ${tab}… (${tab === 'recipes' ? recipes.length : items.length})` : 'Loading DB…'}
            className="w-full px-3 py-1.5 rounded bg-black border border-gray-700 text-white
                       text-sm focus:outline-none focus:border-cyan-700"
          />
          <div className="bg-black border border-gray-800 rounded overflow-y-auto" style={{ height: '280px' }}>
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer border-b border-gray-900/50
                            text-xs transition-colors ${
                              selected?.id === item.id
                                ? 'bg-cyan-900/30 text-cyan-300'
                                : 'text-gray-300 hover:bg-gray-900'
                            }`}
              >
                <span className="text-gray-600 font-mono w-10 shrink-0">{item.id}</span>
                <span className="truncate">{item.eng}</span>
                {variationIds.has(item.id.toUpperCase()) && (
                  <span className="ml-auto text-[8px] text-purple-500 shrink-0">VAR</span>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-gray-600 text-xs text-center py-8">No results</div>
            )}
          </div>

          {selected && (
            <div className="bg-cyan-950/30 border border-cyan-800/50 rounded p-3 space-y-2">
              <div className="text-white text-sm font-medium">{selected.eng}</div>
              <div className="text-gray-500 text-xs font-mono">ID: {selected.id}</div>
              <div className="flex gap-3 items-center flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-gray-500 text-xs">Count</label>
                  <input
                    type="number" min="1" max="99" value={count}
                    onChange={e => setCount(e.target.value)}
                    className="w-16 px-2 py-1 rounded bg-black border border-gray-700 text-white
                               text-xs focus:outline-none focus:border-cyan-700"
                  />
                </div>
                {selectedHasVariation && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-500 text-xs">Variation</label>
                    <input
                      type="number" min="0" max="15" value={variation}
                      onChange={e => setVariation(Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded bg-black border border-purple-800 text-purple-300
                                 text-xs focus:outline-none focus:border-purple-600"
                    />
                    <span className="text-gray-600 text-[10px] font-mono">
                      (0x{variation.toString(16).toUpperCase().padStart(2,'0')})
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={injectAll}
                  disabled={!connected}
                  className="px-3 py-1 text-xs rounded border border-amber-700 text-amber-400
                             hover:bg-amber-900/30 transition-colors disabled:opacity-30"
                >
                  Fill All 40
                </button>
              </div>
              {status && (
                <p className={`text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {status}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Inventory grid */}
        <div className="space-y-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            Inventory · Player {player} · 40 slots
          </span>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 40 }).map((_, i) => {
              const slot = slots[i];
              const isEmpty = !slot || slot.itemId === EMPTY_ID;
              const name = itemName(slot);
              const hasVar = slot && slot.variation > 0;
              return (
                <div
                  key={i}
                  onClick={() => selected && injectSlot(i)}
                  onContextMenu={(e) => { e.preventDefault(); deleteSlot(i); }}
                  title={`Slot ${i + 1}: ${name}${slot ? ` (×${slot.count})` : ''}${hasVar ? ` var:0x${slot.variation.toString(16).toUpperCase().padStart(2,'0')}` : ''}\nLeft click to inject · Right click to delete`}
                  className={`relative h-12 rounded border cursor-pointer transition-colors text-center flex flex-col items-center justify-center
                    ${isEmpty
                      ? 'bg-gray-950 border-gray-800 text-gray-700'
                      : 'bg-gray-900 border-gray-600 text-gray-300'
                    }
                    ${selected ? 'hover:border-cyan-700 hover:bg-cyan-950/20' : ''}
                  `}
                >
                  <span className="text-[9px] text-gray-600 absolute top-0.5 left-1">{i + 1}</span>
                  {hasVar && (
                    <span className="text-[7px] text-purple-600 absolute top-0.5 right-1 font-mono">
                      v{slot.variation.toString(16).toUpperCase()}
                    </span>
                  )}
                  {!isEmpty && (
                    <>
                      <span className="text-[8px] font-mono text-cyan-600">{slot.itemId}</span>
                      <span className="text-[9px] truncate w-full px-1 text-center leading-none">{name}</span>
                      {slot.count > 1 && <span className="text-[8px] text-gray-500">×{slot.count}</span>}
                    </>
                  )}
                  {isEmpty && <span className="text-[9px]">empty</span>}
                </div>
              );
            })}
          </div>
          <p className="text-gray-700 text-[9px]">Left-click slot to inject selected · Right-click to delete</p>
        </div>
      </div>
    </div>
  );
}
