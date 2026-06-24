import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'nhle_cheats';

function loadCheats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveCheats(cheats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cheats));
}

const MODES = ['heap', 'main', 'absolute'];
const TYPES = ['u8','u16','u32','u64','i8','i16','i32','i64','float','double','hex'];

function valueToHex(val, type) {
  try {
    let buf;
    switch (type) {
      case 'hex':    return val.replace(/^0x/i, '');
      case 'u8':     buf = Buffer.alloc(1);  buf.writeUInt8(Number(val));        break;
      case 'u16':    buf = Buffer.alloc(2);  buf.writeUInt16LE(Number(val));     break;
      case 'u32':    buf = Buffer.alloc(4);  buf.writeUInt32LE(Number(val));     break;
      case 'u64':    buf = Buffer.alloc(8);  buf.writeBigUInt64LE(BigInt(val));  break;
      case 'i8':     buf = Buffer.alloc(1);  buf.writeInt8(Number(val));         break;
      case 'i16':    buf = Buffer.alloc(2);  buf.writeInt16LE(Number(val));      break;
      case 'i32':    buf = Buffer.alloc(4);  buf.writeInt32LE(Number(val));      break;
      case 'i64':    buf = Buffer.alloc(8);  buf.writeBigInt64LE(BigInt(val));   break;
      case 'float':  buf = Buffer.alloc(4);  buf.writeFloatLE(Number(val));      break;
      case 'double': buf = Buffer.alloc(8);  buf.writeDoubleLE(Number(val));     break;
      default:       return val;
    }
    return buf.toString('hex');
  } catch { return null; }
}

const pokeFnMap = { heap: 'poke', main: 'pokeMain', absolute: 'pokeAbsolute' };

export default function CheatManager({ connected }) {
  const [cheats, setCheats]       = useState(loadCheats);
  const [frozen, setFrozen]       = useState({});
  const [status, setStatus]       = useState({});
  const [showAdd, setShowAdd]     = useState(false);

  const [form, setForm] = useState({ name: '', address: '0x00000000', mode: 'heap', type: 'u32', value: '' });

  useEffect(() => { saveCheats(cheats); }, [cheats]);

  const addCheat = () => {
    if (!form.name || !form.address || !form.value) return;
    setCheats(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ name: '', address: '0x00000000', mode: 'heap', type: 'u32', value: '' });
    setShowAdd(false);
  };

  const removeCheat = (id) => {
    setCheats(prev => prev.filter(c => c.id !== id));
    setFrozen(prev => { const n = {...prev}; delete n[id]; return n; });
  };

  const applyCheat = useCallback(async (cheat) => {
    if (!connected) return;
    const hex = valueToHex(cheat.value, cheat.type);
    if (!hex) { setStatus(s => ({...s, [cheat.id]: 'Invalid value'})); return; }
    const res = await window.sysbot[pokeFnMap[cheat.mode]](cheat.address, '0x' + hex);
    setStatus(s => ({...s, [cheat.id]: res.ok ? 'Applied!' : 'Error: ' + res.error}));
    setTimeout(() => setStatus(s => ({...s, [cheat.id]: ''})), 2000);
  }, [connected]);

  const toggleFreeze = useCallback(async (cheat) => {
    if (!connected) return;
    const isFrozen = frozen[cheat.id];
    if (!isFrozen) {
      const hex = valueToHex(cheat.value, cheat.type);
      if (!hex) return;
      const res = await window.sysbot.freeze(cheat.address, '0x' + hex);
      if (res.ok) setFrozen(f => ({...f, [cheat.id]: true}));
    } else {
      const res = await window.sysbot.unFreeze(cheat.address);
      if (res.ok) setFrozen(f => ({...f, [cheat.id]: false}));
    }
  }, [connected, frozen]);

  const clearAll = useCallback(async () => {
    if (!connected) return;
    await window.sysbot.freezeClear();
    setFrozen({});
  }, [connected]);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-cyan-400 font-bold tracking-widest text-sm uppercase">Cheats</h2>
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            disabled={!connected}
            className="px-3 py-1 text-xs rounded border border-gray-700 text-gray-400
                       hover:border-red-700 hover:text-red-400 transition-colors disabled:opacity-30"
          >
            Clear All Freezes
          </button>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="px-3 py-1 text-xs rounded bg-cyan-900/40 border border-cyan-700
                       text-cyan-300 hover:bg-cyan-900/60 transition-colors"
          >
            + Add Cheat
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-[#0f0f1a] border border-cyan-900/50 rounded-lg p-4 space-y-3">
          <p className="text-[10px] text-cyan-600 uppercase tracking-widest">New Cheat</p>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e => setForm(f => ({...f, name: e.target.value}))}
            className="w-full px-3 py-1.5 rounded bg-gray-900 border border-gray-700 text-white text-sm
                       focus:outline-none focus:border-cyan-600"
          />
          <div className="flex gap-2">
            <input
              placeholder="0x00000000"
              value={form.address}
              onChange={e => setForm(f => ({...f, address: e.target.value}))}
              className="flex-1 px-3 py-1.5 rounded bg-gray-900 border border-gray-700 text-cyan-300
                         font-mono text-sm focus:outline-none focus:border-cyan-600"
            />
            <select
              value={form.mode}
              onChange={e => setForm(f => ({...f, mode: e.target.value}))}
              className="px-2 py-1.5 rounded bg-gray-900 border border-gray-700 text-cyan-300 text-sm"
            >
              {MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <select
              value={form.type}
              onChange={e => setForm(f => ({...f, type: e.target.value}))}
              className="px-2 py-1.5 rounded bg-gray-900 border border-gray-700 text-cyan-300 text-sm"
            >
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input
              placeholder="value"
              value={form.value}
              onChange={e => setForm(f => ({...f, value: e.target.value}))}
              className="flex-1 px-3 py-1.5 rounded bg-gray-900 border border-gray-700 text-white
                         text-sm focus:outline-none focus:border-cyan-600"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addCheat}
              disabled={!form.name || !form.value}
              className="px-4 py-1.5 rounded bg-cyan-900/40 border border-cyan-700 text-cyan-300
                         text-sm hover:bg-cyan-900/60 transition-colors disabled:opacity-30"
            >
              Save
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-1.5 rounded border border-gray-700 text-gray-400 text-sm
                         hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cheat list */}
      {cheats.length === 0 ? (
        <div className="text-center text-gray-600 text-sm py-12">
          No cheats saved. Add one above.
        </div>
      ) : (
        <div className="space-y-2">
          {cheats.map(cheat => (
            <div
              key={cheat.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors
                ${frozen[cheat.id]
                  ? 'bg-amber-950/20 border-amber-800/50'
                  : 'bg-[#0f0f1a] border-gray-800'
                }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">{cheat.name}</div>
                <div className="text-gray-500 text-xs font-mono truncate">
                  {cheat.address} · {cheat.mode} · {cheat.type} = {cheat.value}
                </div>
                {status[cheat.id] && (
                  <div className={`text-xs mt-0.5 ${status[cheat.id].startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                    {status[cheat.id]}
                  </div>
                )}
              </div>
              <button
                onClick={() => applyCheat(cheat)}
                disabled={!connected}
                className="px-3 py-1 rounded text-xs border border-blue-800 text-blue-400
                           hover:bg-blue-900/30 transition-colors disabled:opacity-30"
              >
                Apply
              </button>
              <button
                onClick={() => toggleFreeze(cheat)}
                disabled={!connected}
                className={`px-3 py-1 rounded text-xs border transition-colors disabled:opacity-30 ${
                  frozen[cheat.id]
                    ? 'border-amber-600 text-amber-400 hover:bg-amber-900/30'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {frozen[cheat.id] ? 'Unfreeze' : 'Freeze'}
              </button>
              <button
                onClick={() => removeCheat(cheat.id)}
                className="text-gray-600 hover:text-red-400 transition-colors px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
