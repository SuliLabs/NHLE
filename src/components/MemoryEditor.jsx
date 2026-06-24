import { useState, useCallback, useEffect, useRef } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────────
const BPR   = 16;   // bytes per row
const ROWS  = 16;   // rows visible
const PAGE  = BPR * ROWS; // 256 bytes per page
const MODES = ['heap', 'main', 'absolute'];

// ── Helpers ────────────────────────────────────────────────────────────────────
function hexToBytes(hexStr) {
  const n = Math.floor(hexStr.length / 2);
  const arr = new Uint8Array(n);
  for (let i = 0; i < n; i++)
    arr[i] = parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
  return arr;
}

function b2h(b)    { return b.toString(16).padStart(2, '0').toUpperCase(); }
function fmtAddr(n){ return n.toString(16).padStart(8, '0').toUpperCase(); }
function printable(b){ return b >= 0x20 && b <= 0x7E ? String.fromCharCode(b) : '.'; }

function parseAddr(s) {
  const n = parseInt(s.replace(/^0x/i, ''), 16);
  return isNaN(n) ? null : n >>> 0;
}

function interpByte(bytes, offset) {
  if (!bytes || offset < 0 || offset >= bytes.length) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out  = { hex: b2h(bytes[offset]), u8: bytes[offset] };
  if (offset + 2 <= bytes.length)  out.u16 = view.getUint16(offset, true);
  if (offset + 4 <= bytes.length) { out.u32 = view.getUint32(offset, true); out.i32 = view.getInt32(offset, true); out.f32 = view.getFloat32(offset, true); }
  if (offset + 8 <= bytes.length) { out.f64 = view.getFloat64(offset, true); }
  return out;
}

const PEEK_FN = { heap: 'peek', main: 'peekMain', absolute: 'peekAbsolute' };
const POKE_FN = { heap: 'poke', main: 'pokeMain', absolute: 'pokeAbsolute' };

// ── Component ──────────────────────────────────────────────────────────────────
export default function MemoryEditor({ connected }) {
  const [addrInput, setAddrInput] = useState('0xB27BB758');
  const [mode, setMode]           = useState('heap');
  const [bytes, setBytes]         = useState(null);       // Uint8Array | null
  const [baseAddr, setBaseAddr]   = useState(0xB27BB758);
  const [selIdx, setSelIdx]       = useState(null);       // selected byte index in page
  const [editStr, setEditStr]     = useState('');         // 0 or 1 hex char typed
  const [dirty, setDirty]         = useState(new Set());  // indices written this session
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(false);
  const containerRef = useRef(null);

  // ── Read page ────────────────────────────────────────────────────────────────
  const readPage = useCallback(async (addr, md = mode) => {
    if (!connected) return;
    setLoading(true);
    setStatus('');
    const res = await window.sysbot[PEEK_FN[md]]('0x' + fmtAddr(addr), PAGE);
    setLoading(false);
    if (res.ok) {
      setBytes(hexToBytes(res.data));
      setBaseAddr(addr);
      setDirty(new Set());
    } else {
      setStatus('Error: ' + res.error);
      setBytes(null);
    }
  }, [connected, mode]);

  // ── Write single byte ────────────────────────────────────────────────────────
  const writeByte = useCallback(async (idx, byteVal) => {
    if (!connected || !bytes) return;
    const addr = baseAddr + idx;
    const res  = await window.sysbot[POKE_FN[mode]]('0x' + fmtAddr(addr), '0x' + b2h(byteVal));
    if (res.ok) {
      const next = new Uint8Array(bytes);
      next[idx] = byteVal;
      setBytes(next);
      setDirty(d => new Set([...d, idx]));
    } else {
      setStatus('Write error: ' + res.error);
    }
  }, [connected, bytes, baseAddr, mode]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const navigate = useCallback((delta) => {
    const addr = parseAddr(addrInput);
    if (addr === null) return;
    const newAddr = (addr + delta) >>> 0;
    setAddrInput('0x' + fmtAddr(newAddr));
    readPage(newAddr);
  }, [addrInput, readPage]);

  const goToAddr = useCallback(() => {
    const addr = parseAddr(addrInput);
    if (addr === null) { setStatus('Invalid address'); return; }
    readPage(addr);
  }, [addrInput, readPage]);

  // ── Keyboard handling ────────────────────────────────────────────────────────
  const handleKey = useCallback((e) => {
    if (selIdx === null || !bytes) return;

    const key = e.key.toUpperCase();

    if (/^[0-9A-F]$/.test(key)) {
      e.preventDefault();
      const next = editStr + key;
      if (next.length === 1) {
        setEditStr(next);
      } else {
        const val = parseInt(next, 16);
        writeByte(selIdx, val);
        setEditStr('');
        // advance selection
        if (selIdx < PAGE - 1) setSelIdx(selIdx + 1);
      }
      return;
    }

    if (key === 'BACKSPACE') {
      e.preventDefault();
      setEditStr('');
      return;
    }
    if (key === 'ESCAPE') { e.preventDefault(); setSelIdx(null); setEditStr(''); return; }
    if (key === 'DELETE')  { e.preventDefault(); writeByte(selIdx, 0); return; }

    // Arrow navigation
    let next = selIdx;
    if (key === 'ARROWRIGHT') next = Math.min(PAGE - 1, selIdx + 1);
    if (key === 'ARROWLEFT')  next = Math.max(0, selIdx - 1);
    if (key === 'ARROWDOWN')  next = Math.min(PAGE - 1, selIdx + BPR);
    if (key === 'ARROWUP')    next = Math.max(0, selIdx - BPR);
    if (key === 'PAGEDOWN')   { navigate(PAGE); return; }
    if (key === 'PAGEUP')     { navigate(-PAGE); return; }

    if (next !== selIdx) {
      e.preventDefault();
      setSelIdx(next);
      setEditStr('');
    }
  }, [selIdx, bytes, editStr, writeByte, navigate]);

  useEffect(() => {
    if (selIdx !== null) containerRef.current?.focus();
  }, [selIdx]);

  // ── Render ───────────────────────────────────────────────────────────────────
  const interp  = bytes && selIdx !== null ? interpByte(bytes, selIdx) : null;
  const selAddr = selIdx !== null ? baseAddr + selIdx : null;

  return (
    <div className="flex flex-col h-full gap-2 font-mono text-xs select-none">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <input
          value={addrInput}
          onChange={e => setAddrInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && goToAddr()}
          className="w-36 px-2 py-1 rounded bg-[#1a1a1a] border border-[#404040]
                     text-[#00BFFF] font-mono text-xs focus:outline-none focus:border-[#00BFFF]"
          placeholder="0x00000000"
          spellCheck={false}
        />
        <select
          value={mode}
          onChange={e => { setMode(e.target.value); }}
          className="px-2 py-1 rounded bg-[#1a1a1a] border border-[#404040]
                     text-[#00BFFF] text-xs focus:outline-none"
        >
          {MODES.map(m => <option key={m}>{m}</option>)}
        </select>
        <button onClick={goToAddr} disabled={!connected || loading}
          className="px-3 py-1 rounded bg-[#003060] border border-[#005090] text-[#00BFFF]
                     hover:bg-[#004070] disabled:opacity-30 transition-colors">
          Go
        </button>
        <div className="flex gap-1">
          {[[-PAGE,'◄◄'], [-BPR,'◄'], [BPR,'►'], [PAGE,'►►']].map(([d, lbl]) => (
            <button key={lbl} onClick={() => navigate(d)} disabled={!connected || !bytes || loading}
              className="px-2 py-1 rounded bg-[#1a1a1a] border border-[#404040] text-[#808080]
                         hover:text-white hover:border-[#606060] disabled:opacity-30 transition-colors">
              {lbl}
            </button>
          ))}
        </div>
        {loading && <span className="text-[#606060]">reading…</span>}
      </div>

      {/* ── Hex view ── */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKey}
        className="flex-1 overflow-auto bg-[#1a1a1a] border border-[#303030] rounded
                   focus:outline-none focus:border-[#404080] cursor-default"
        style={{ minHeight: 0 }}
      >
        {!bytes ? (
          <div className="flex items-center justify-center h-full text-[#404040]">
            {connected ? 'Enter an address and click Go' : 'Not connected'}
          </div>
        ) : (
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            {/* Header row */}
            <thead>
              <tr className="text-[#505050] border-b border-[#303030]">
                <td className="px-2 py-0.5 w-24">Address</td>
                {Array.from({ length: BPR }).map((_, i) => (
                  <td key={i}
                    className={`text-center w-6 ${i % 4 === 0 && i > 0 ? 'pl-3' : ''}`}
                    style={{ color: i % 8 === 0 ? '#606060' : '#404040' }}>
                    {i.toString(16).toUpperCase().padStart(2,'0')}
                  </td>
                ))}
                <td className="px-2 text-[#404040]" style={{ paddingLeft: '12px' }}>
                  {'0123456789ABCDEF'}
                </td>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }).map((_, row) => {
                const rowAddr = baseAddr + row * BPR;
                return (
                  <tr key={row}
                    className={`border-b border-[#232323] ${row % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#1d1d1d]'}`}
                  >
                    {/* Address */}
                    <td className="px-2 py-px text-[#00A0C8] whitespace-nowrap">
                      {fmtAddr(rowAddr)}
                    </td>

                    {/* Hex bytes */}
                    {Array.from({ length: BPR }).map((_, col) => {
                      const idx = row * BPR + col;
                      const b   = bytes[idx];
                      const isSel    = idx === selIdx;
                      const isEditing = isSel && editStr.length > 0;
                      const isDirty  = dirty.has(idx);
                      const extraLeft = col % 4 === 0 && col > 0;

                      let cellText = b2h(b);
                      let fg = isDirty ? '#FF6060' : '#D0D0D0';
                      if (b === 0x00) fg = '#505050';
                      if (b === 0xFF) fg = '#808080';

                      return (
                        <td key={col}
                          onClick={() => { setSelIdx(idx); setEditStr(''); containerRef.current?.focus(); }}
                          className={`text-center py-px cursor-pointer transition-colors ${extraLeft ? 'pl-3' : ''}`}
                          style={{
                            backgroundColor: isSel ? '#00406080' : undefined,
                            outline: isSel ? '1px solid #00BFFF' : undefined,
                            color: isSel ? '#FFFFFF' : fg,
                          }}
                        >
                          {isEditing ? (
                            <span>{editStr}<span className="animate-pulse opacity-60">_</span></span>
                          ) : (
                            cellText
                          )}
                        </td>
                      );
                    })}

                    {/* ASCII */}
                    <td className="py-px whitespace-nowrap" style={{ paddingLeft: '12px' }}>
                      {Array.from({ length: BPR }).map((_, col) => {
                        const idx = row * BPR + col;
                        const b   = bytes[idx];
                        const ch  = printable(b);
                        const isSel = idx === selIdx;
                        return (
                          <span key={col}
                            onClick={() => { setSelIdx(idx); setEditStr(''); containerRef.current?.focus(); }}
                            style={{
                              color: isSel ? '#FFFFFF' : (ch === '.' ? '#383838' : '#808080'),
                              backgroundColor: isSel ? '#00406080' : undefined,
                              cursor: 'pointer',
                            }}
                          >
                            {ch}
                          </span>
                        );
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="shrink-0 flex gap-4 items-center px-2 py-1 bg-[#141414]
                      border border-[#303030] rounded text-[10px]">
        {selAddr !== null ? (
          <>
            <span className="text-[#00A0C8]">Addr: {fmtAddr(selAddr)}</span>
            {interp && (
              <>
                <span className="text-[#D0D0D0]">Hex: {interp.hex}</span>
                <span className="text-[#A0A0A0]">u8: {interp.u8}</span>
                {'u16' in interp && <span className="text-[#A0A0A0]">u16: {interp.u16}</span>}
                {'u32' in interp && <span className="text-[#A0A0A0]">u32: 0x{interp.u32.toString(16).toUpperCase().padStart(8,'0')}</span>}
                {'i32' in interp && interp.i32 !== interp.u32 && <span className="text-[#A0A0A0]">i32: {interp.i32}</span>}
                {'f32' in interp && <span className="text-[#A0C880]">f32: {interp.f32.toPrecision(6)}</span>}
                {'f64' in interp && <span className="text-[#A0C880]">f64: {interp.f64.toPrecision(6)}</span>}
              </>
            )}
            <span className="text-[#505050] ml-auto">
              {editStr ? `typing: ${editStr}_` : 'type 2 hex chars to edit · arrows to navigate · Del to zero'}
            </span>
          </>
        ) : (
          <>
            <span className="text-[#404040]">
              {bytes ? `${PAGE} bytes @ 0x${fmtAddr(baseAddr)}` : 'Click Go to load memory'}
            </span>
            {status && <span className="text-red-400 ml-auto">{status}</span>}
          </>
        )}
        {status && selAddr !== null && <span className="text-red-400 ml-auto">{status}</span>}
      </div>
    </div>
  );
}
