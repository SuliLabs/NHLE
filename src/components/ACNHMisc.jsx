import { useState, useCallback } from 'react';
import { ADDR, AIRPORT_COLORS } from '../data/acnh.js';
import { getItemSlotBase, setItemSlotBase, clearItemSlotBase } from '../data/overrides.js';

function hex(n) { return '0x' + n.toString(16).toUpperCase(); }

// Convert string to UTF-16 LE hex pattern (uppercase, no separator)
function toUtf16le(str) {
  return str.split('').map(c => {
    const code = c.charCodeAt(0);
    return (code & 0xFF).toString(16).padStart(2,'0') + ((code >> 8) & 0xFF).toString(16).padStart(2,'0');
  }).join('').toUpperCase();
}

// Offset from island-name address to ItemSlotBase (from ACNHPokerCore: InventoryNameOffset)
const INVENTORY_NAME_OFFSET = 0x2BA60;
// Expected town-name address in 2.x (used as scan center)
const SCAN_CENTER = 0xB278FCF8;
// ±8MB scan range, 8KB chunks, 2KB overlap to catch cross-boundary matches
const SCAN_HALF   = 0x800000;
const CHUNK_SIZE  = 0x2000;
const OVERLAP     = 40; // bytes (covers island name length ×2 to be safe)

export default function ACNHMisc({ connected }) {
  const [dodo, setDodo]           = useState('');
  const [weather, setWeather]     = useState('');
  const [newWeather, setNewWeather] = useState('');
  const [airportColor, setAirportColor] = useState(null);
  const [status, setStatus]       = useState('');
  const [coords, setCoords]       = useState(null);
  const [scanIsland, setScanIsland]   = useState('rerrewoof');
  const [scanProgress, setScanProgress] = useState(null);  // null | { pct, found }
  const [detectedBase, setDetectedBase] = useState(() => getItemSlotBase());

  const ok = (msg) => { setStatus(msg); setTimeout(() => setStatus(''), 2500); };

  const scanPlayerBase = useCallback(async () => {
    if (!connected || !scanIsland.trim()) return;
    const pattern = toUtf16le(scanIsland.trim());
    const patBytes = pattern.length / 2; // byte length of pattern

    const start = SCAN_CENTER - SCAN_HALF;
    const totalChunks = Math.ceil((SCAN_HALF * 2) / CHUNK_SIZE);
    setScanProgress({ pct: 0, found: null });

    let prevTail = '';  // overlap: last OVERLAP bytes of previous chunk (as hex)

    for (let i = 0; i < totalChunks; i++) {
      const addr = start + i * CHUNK_SIZE;
      const res = await window.sysbot.peek(hex(addr), CHUNK_SIZE);

      if (res.ok) {
        // Search in overlap + current chunk
        const searchStr = (prevTail + res.data).toUpperCase();
        const idx = searchStr.indexOf(pattern);
        if (idx !== -1 && idx % 2 === 0) {
          // Found — compute byte position relative to addr
          const overlapBytes = prevTail.length / 2;
          const bytePos = idx / 2 - overlapBytes;
          const foundAddr = addr + bytePos;
          const newBase = foundAddr + INVENTORY_NAME_OFFSET;
          setItemSlotBase(newBase);
          setDetectedBase(newBase);
          setScanProgress({ pct: 100, found: { islandAddr: foundAddr, base: newBase } });
          return;
        }
        // Keep tail for next iteration
        prevTail = res.data.slice(-(OVERLAP * 2));
      } else {
        prevTail = '';
      }

      if (i % 16 === 0) {
        setScanProgress({ pct: Math.round((i / totalChunks) * 100), found: null });
        // Yield to UI
        await new Promise(r => setTimeout(r, 0));
      }
    }

    setScanProgress({ pct: 100, found: null });
  }, [connected, scanIsland]);

  const readDodo = useCallback(async () => {
    if (!connected) return;
    const res = await window.sysbot.peek(hex(ADDR.DodoCode), 6);
    if (!res.ok) { setStatus('Error: ' + res.error); return; }
    // Dodo code is 5 chars in UTF-16 LE (12 bytes) or ASCII 5 bytes
    // Actually in ACNH the dodo code is 5 ASCII chars
    const hex6 = res.data.slice(0, 12);
    let code = '';
    for (let i = 0; i < 5; i++) {
      const charCode = parseInt(hex6[i*2]+hex6[i*2+1], 16);
      if (charCode > 0) code += String.fromCharCode(charCode);
    }
    setDodo(code || res.data.slice(0, 10));
  }, [connected]);

  const readWeather = useCallback(async () => {
    if (!connected) return;
    const res = await window.sysbot.peek(hex(ADDR.WeatherSeed), 4);
    if (!res.ok) return;
    const hex4 = res.data;
    const val = parseInt(hex4[6]+hex4[7]+hex4[4]+hex4[5]+hex4[2]+hex4[3]+hex4[0]+hex4[1], 16);
    setWeather('0x' + val.toString(16).toUpperCase().padStart(8, '0'));
  }, [connected]);

  const writeWeather = useCallback(async () => {
    if (!connected || !newWeather) return;
    const n = parseInt(newWeather, 16);
    if (isNaN(n)) { setStatus('Invalid hex seed'); return; }
    const le = n.toString(16).padStart(8, '0');
    const leFlipped = le[6]+le[7]+le[4]+le[5]+le[2]+le[3]+le[0]+le[1];
    const res = await window.sysbot.poke(hex(ADDR.WeatherSeed), '0x' + leFlipped);
    if (res.ok) { ok('Weather seed written'); readWeather(); }
    else setStatus('Error: ' + res.error);
  }, [connected, newWeather, readWeather]);

  const readCoords = useCallback(async () => {
    if (!connected) return;
    const res = await window.sysbot.peek(hex(ADDR.Coordinate), 12);
    if (!res.ok) return;
    const h = res.data;
    const readFloat = (offset) => {
      const b = h.slice(offset * 2, offset * 2 + 8);
      const view = new DataView(new ArrayBuffer(4));
      for (let i = 0; i < 4; i++) view.setUint8(i, parseInt(b.slice(i * 2, i * 2 + 2), 16));
      return view.getFloat32(0, true).toFixed(2);
    };
    setCoords({ x: readFloat(0), y: readFloat(4), z: readFloat(8) });
  }, [connected]);

  const readAirport = useCallback(async () => {
    if (!connected) return;
    const res = await window.sysbot.peek(hex(ADDR.AirportColor), 1);
    if (!res.ok) return;
    setAirportColor(parseInt(res.data.slice(0, 2), 16));
  }, [connected]);

  const writeAirport = useCallback(async (colorIdx) => {
    if (!connected) return;
    const val = colorIdx.toString(16).padStart(2, '0').toUpperCase();
    const res = await window.sysbot.poke(hex(ADDR.AirportColor), '0x' + val);
    if (res.ok) { setAirportColor(colorIdx); ok(`Airport: ${AIRPORT_COLORS[colorIdx]}`); }
  }, [connected]);

  return (
    <div className="max-w-md space-y-4">
      {status && (
        <p className={`text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
          {status}
        </p>
      )}

      {/* Dodo code */}
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Dodo Code</p>
        <div className="flex items-center gap-3">
          {dodo
            ? <span className="text-2xl font-bold text-cyan-400 tracking-widest font-mono">{dodo}</span>
            : <span className="text-gray-600 text-sm">Not read yet</span>
          }
          <button onClick={readDodo} disabled={!connected}
            className="px-2 py-1 text-xs rounded border border-gray-700 text-gray-400
                       hover:border-cyan-700 hover:text-cyan-400 transition-colors disabled:opacity-30">
            Read
          </button>
        </div>
      </div>

      {/* Coordinates */}
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Player Coordinates</p>
          <button onClick={readCoords} disabled={!connected}
            className="px-2 py-0.5 text-xs rounded border border-gray-700 text-gray-400
                       hover:border-cyan-700 hover:text-cyan-400 transition-colors disabled:opacity-30">
            Read
          </button>
        </div>
        {coords ? (
          <div className="grid grid-cols-3 gap-2">
            {['x','y','z'].map(axis => (
              <div key={axis} className="text-center">
                <div className="text-gray-500 text-[10px] uppercase">{axis}</div>
                <div className="text-white font-mono text-sm">{coords[axis]}</div>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-600 text-xs">Not read yet</span>
        )}
      </div>

      {/* Weather seed */}
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Weather Seed</p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-cyan-300 font-mono text-sm">{weather || '—'}</span>
          <button onClick={readWeather} disabled={!connected}
            className="px-2 py-0.5 text-xs rounded border border-gray-700 text-gray-400
                       hover:border-cyan-700 hover:text-cyan-400 transition-colors disabled:opacity-30">
            Read
          </button>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="0xXXXXXXXX new seed"
            value={newWeather}
            onChange={e => setNewWeather(e.target.value)}
            className="flex-1 px-2 py-1 rounded bg-black border border-gray-700 text-cyan-300
                       font-mono text-xs focus:outline-none focus:border-cyan-700"
          />
          <button onClick={writeWeather} disabled={!connected || !newWeather}
            className="px-3 py-1 text-xs rounded border border-cyan-700 text-cyan-400
                       hover:bg-cyan-900/30 transition-colors disabled:opacity-30">
            Write
          </button>
        </div>
      </div>

      {/* Airport color */}
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Airport Color</p>
          <button onClick={readAirport} disabled={!connected}
            className="px-2 py-0.5 text-xs rounded border border-gray-700 text-gray-400
                       hover:border-cyan-700 hover:text-cyan-400 transition-colors disabled:opacity-30">
            Read
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {AIRPORT_COLORS.map((color, i) => {
            const colorMap = { Yellow:'#eab308', Blue:'#3b82f6', Orange:'#f97316', Green:'#22c55e', Red:'#ef4444', Purple:'#a855f7' };
            return (
              <button
                key={i}
                onClick={() => writeAirport(i)}
                disabled={!connected}
                style={{ borderColor: airportColor === i ? colorMap[color] : undefined }}
                className={`px-3 py-1.5 text-xs rounded border transition-colors disabled:opacity-30 ${
                  airportColor === i ? 'text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span style={{ color: colorMap[color] }}>●</span> {color}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inventory base detection */}
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Find Inventory Base</p>
          {detectedBase && (
            <button
              onClick={() => { clearItemSlotBase(); setDetectedBase(null); setScanProgress(null); }}
              className="text-[10px] text-red-500 hover:text-red-400"
            >
              reset
            </button>
          )}
        </div>

        {detectedBase ? (
          <div className="space-y-1">
            <div className="text-[10px] text-green-500 uppercase tracking-wider">✓ Detected</div>
            <div className="font-mono text-sm text-cyan-300">{hex(detectedBase)}</div>
            <div className="text-gray-600 text-[10px]">Stored in localStorage — inventory uses this address</div>
          </div>
        ) : (
          <div className="text-gray-600 text-xs">Using default: {hex(ADDR.ItemSlotBase)}</div>
        )}

        <div className="flex gap-2 items-center">
          <input
            value={scanIsland}
            onChange={e => setScanIsland(e.target.value)}
            placeholder="Island name"
            className="flex-1 px-2 py-1 rounded bg-black border border-gray-700 text-white
                       font-mono text-xs focus:outline-none focus:border-cyan-700"
          />
          <button
            onClick={scanPlayerBase}
            disabled={!connected || !!scanProgress && scanProgress.pct < 100}
            className="px-3 py-1 text-xs rounded border border-cyan-700 text-cyan-400
                       hover:bg-cyan-900/30 transition-colors disabled:opacity-30 shrink-0"
          >
            {scanProgress && scanProgress.pct < 100 ? `Scanning ${scanProgress.pct}%…` : 'Scan Memory'}
          </button>
        </div>

        {scanProgress && scanProgress.pct < 100 && (
          <div className="h-1 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-cyan-600 transition-all"
              style={{ width: `${scanProgress.pct}%` }}
            />
          </div>
        )}

        {scanProgress?.pct === 100 && !scanProgress.found && (
          <div className="text-red-400 text-xs">
            Island name not found in ±8MB scan range. Try scanning while in-game on your island.
          </div>
        )}

        {scanProgress?.found && (
          <div className="text-green-400 text-xs space-y-0.5">
            <div>Island name @ {hex(scanProgress.found.islandAddr)}</div>
            <div>→ ItemSlotBase = {hex(scanProgress.found.base)}</div>
          </div>
        )}

        <div className="text-gray-700 text-[10px]">
          Searches ±8MB around 0xB278FCF8 for island name in UTF-16 LE.
          Must be in-game on island. Takes ~10s.
        </div>
      </div>
    </div>
  );
}
