import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  parseItemsCSV, parseRecipesCSV,
  MAP_ACTIVATE, MAP_SLOT_COUNT, SAVE_FILE_BUFFER,
  buildDropLeft, buildDropRight,
} from '../data/acnh.js';

let _items = null;
let _recipes = null;

async function loadItems() {
  if (_items) return _items;
  const [ir, rr] = await Promise.all([
    fetch('/data/items.csv'),
    fetch('/data/recipes.csv'),
  ]);
  const [it, rt] = await Promise.all([ir.text(), rr.text()]);
  _items   = parseItemsCSV(it);
  _recipes = parseRecipesCSV(rt);
  return _items;
}

function h(n) { return '0x' + n.toString(16).toUpperCase(); }

export default function ACNHDrop({ connected }) {
  const [items, setItems]     = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [dbReady, setDbReady] = useState(false);
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [qty, setQty]         = useState(1);
  const [tab, setTab]         = useState('items');
  const [status, setStatus]   = useState('');
  const [busy, setBusy]       = useState(false);

  useEffect(() => {
    loadItems().then(its => {
      setItems(its);
      setRecipes(_recipes);
      setDbReady(true);
    });
  }, []);

  const db = tab === 'recipes' ? recipes : items;
  const filtered = useMemo(() => {
    if (!search.trim()) return db.slice(0, 100);
    const q = search.toLowerCase();
    return db.filter(i => i.eng.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)).slice(0, 100);
  }, [search, db]);

  const dropItem = useCallback(async () => {
    if (!connected || !selected || busy) return;
    setBusy(true);
    setStatus('Scanning active zone…');

    // Read left layer: MAP_SLOT_COUNT (96) slots × 16 bytes = 0x600 bytes
    const res = await window.sysbot.peek(h(MAP_ACTIVATE), 0x600);
    if (!res.ok) {
      setStatus('Error reading map: ' + res.error);
      setBusy(false);
      return;
    }

    // Find first empty slot — FFFF = no item, 0000 = blank, FEFF = deleted (FFFE LE)
    const data = res.data.toUpperCase();
    let slotIdx = -1;
    for (let i = 0; i < MAP_SLOT_COUNT; i++) {
      const first4 = data.slice(i * 32, i * 32 + 4);
      if (first4 === 'FFFF' || first4 === '0000' || first4 === 'FEFF') {
        slotIdx = i;
        break;
      }
    }

    if (slotIdx === -1) {
      setStatus('No empty map tile found in active zone (all 96 slots occupied)');
      setBusy(false);
      return;
    }

    const addr = MAP_ACTIVATE + slotIdx * 16;
    const leftHex  = buildDropLeft(selected.id, qty);
    const rightHex = buildDropRight(selected.id);

    // Write left layer + save mirror
    const r1 = await window.sysbot.poke(h(addr), '0x' + leftHex);
    if (!r1.ok) { setStatus('Error (left): ' + r1.error); setBusy(false); return; }

    const r2 = await window.sysbot.poke(h(addr + SAVE_FILE_BUFFER), '0x' + leftHex);
    if (!r2.ok) { setStatus('Error (left save): ' + r2.error); setBusy(false); return; }

    // Write right layer + save mirror
    const r3 = await window.sysbot.poke(h(addr + 0x600), '0x' + rightHex);
    if (!r3.ok) { setStatus('Error (right): ' + r3.error); setBusy(false); return; }

    const r4 = await window.sysbot.poke(h(addr + 0x600 + SAVE_FILE_BUFFER), '0x' + rightHex);
    if (!r4.ok) { setStatus('Error (right save): ' + r4.error); setBusy(false); return; }

    setStatus(`✓ Dropped "${selected.eng}"${qty > 1 ? ` ×${qty}` : ''} → slot ${slotIdx} @ ${h(addr)}`);
    setBusy(false);
    setTimeout(() => setStatus(''), 6000);
  }, [connected, selected, qty, busy]);

  return (
    <div className="space-y-3 max-w-lg">
      <div className="px-3 py-2 bg-gray-900/50 border border-gray-800 rounded text-gray-500 text-xs leading-relaxed">
        Drops item into first empty tile in the active map zone ({MAP_SLOT_COUNT} slots at {h(MAP_ACTIVATE)}).
        <span className="text-amber-500 ml-1">[? address unverified for 3.0.2]</span>
      </div>

      {/* Item/Recipe sub-tabs */}
      <div className="flex gap-1">
        {['items', 'recipes'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(''); setSelected(null); }}
            className={`px-2 py-0.5 text-xs rounded border transition-colors ${
              tab === t
                ? 'border-cyan-700 text-cyan-300 bg-cyan-900/30'
                : 'border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'items' ? 'Items' : 'Recipes'}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={
          dbReady
            ? `Search ${tab}… (${tab === 'recipes' ? recipes.length : items.length} total)`
            : 'Loading database…'
        }
        className="w-full px-3 py-1.5 rounded bg-black border border-gray-700 text-white
                   text-sm focus:outline-none focus:border-cyan-700"
      />

      {/* Results list */}
      <div className="bg-black border border-gray-800 rounded overflow-y-auto" style={{ height: '200px' }}>
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
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-gray-600 text-xs text-center py-8">No results</div>
        )}
      </div>

      {/* Drop action */}
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4 space-y-3">
        {selected ? (
          <>
            <div>
              <div className="text-white text-sm font-medium">{selected.eng}</div>
              <div className="text-gray-500 text-xs font-mono mt-0.5">ID: {selected.id}</div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs">Qty:</span>
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-6 h-6 text-xs rounded border border-gray-700 text-gray-400
                           hover:border-gray-500 hover:text-white transition-colors"
              >−</button>
              <span className="text-white font-mono text-sm w-8 text-center">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(99, q + 1))}
                className="w-6 h-6 text-xs rounded border border-gray-700 text-gray-400
                           hover:border-gray-500 hover:text-white transition-colors"
              >+</button>
            </div>

            <button
              onClick={dropItem}
              disabled={!connected || busy}
              className="w-full py-2 text-sm rounded border border-cyan-700 text-cyan-400
                         hover:bg-cyan-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {busy ? 'Dropping…' : 'Drop on Map'}
            </button>
          </>
        ) : (
          <p className="text-gray-600 text-xs text-center py-2">Select an item above</p>
        )}
      </div>

      {/* Status */}
      {status && (
        <div className={`px-3 py-2 rounded text-xs leading-relaxed ${
          status.startsWith('Error') || status.startsWith('No ')
            ? 'bg-red-900/20 border border-red-800/40 text-red-400'
            : 'bg-green-900/20 border border-green-800/40 text-green-400'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}
