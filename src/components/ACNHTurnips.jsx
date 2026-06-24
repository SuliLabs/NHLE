import { useState, useCallback } from 'react';
import { ADDR, TURNIP_DAYS } from '../data/acnh.js';

function hex(n) { return '0x' + n.toString(16).toUpperCase(); }

function leHex4(buf, offset) {
  const b = buf.slice(offset * 8, offset * 8 + 8);
  if (b.length < 8) return 0;
  return parseInt(b[6]+b[7]+b[4]+b[5]+b[2]+b[3]+b[0]+b[1], 16);
}

export default function ACNHTurnips({ connected }) {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editBuy, setEditBuy] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [status, setStatus] = useState('');

  const readPrices = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    // Buy price: 4 bytes at TurnipBuyPrice
    // Sell prices: 12 × 4 bytes starting at TurnipBuyPrice + 0xC
    const [buyRes, sellRes] = await Promise.all([
      window.sysbot.peek(hex(ADDR.TurnipBuyPrice), 4),
      window.sysbot.peek(hex(ADDR.TurnipSellBase), 48), // 12 * 4
    ]);
    setLoading(false);
    if (!buyRes.ok || !sellRes.ok) {
      setStatus('Error reading prices');
      return;
    }
    const buyHex = buyRes.data;
    const buy = parseInt(buyHex[6]+buyHex[7]+buyHex[4]+buyHex[5]+buyHex[2]+buyHex[3]+buyHex[0]+buyHex[1], 16);
    const sell = [];
    for (let i = 0; i < 12; i++) {
      sell.push(leHex4(sellRes.data, i));
    }
    setPrices({ buy, sell });
    setStatus('');
  }, [connected]);

  const writeBuy = useCallback(async () => {
    if (!connected || !editBuy) return;
    const val = parseInt(editBuy);
    if (isNaN(val) || val < 90 || val > 110) { setStatus('Buy price must be 90-110 bells'); return; }
    const hex4 = val.toString(16).padStart(8, '0');
    const le = hex4[6]+hex4[7]+hex4[4]+hex4[5]+hex4[2]+hex4[3]+hex4[0]+hex4[1];
    const res = await window.sysbot.poke(hex(ADDR.TurnipBuyPrice), '0x' + le);
    if (res.ok) { setStatus('Buy price updated'); readPrices(); }
    else setStatus('Error: ' + res.error);
    setTimeout(() => setStatus(''), 2000);
  }, [connected, editBuy, readPrices]);

  const writeSell = useCallback(async (idx, val) => {
    if (!connected) return;
    const n = parseInt(val);
    if (isNaN(n) || n < 1 || n > 999) { setStatus('Invalid price (1-999)'); return; }
    const hex4 = n.toString(16).padStart(8, '0');
    const le = hex4[6]+hex4[7]+hex4[4]+hex4[5]+hex4[2]+hex4[3]+hex4[0]+hex4[1];
    const addr = ADDR.TurnipSellBase + idx * 4;
    const res = await window.sysbot.poke(hex(addr), '0x' + le);
    if (res.ok) {
      setPrices(p => { const n2 = {...p, sell: [...p.sell]}; n2.sell[idx] = n; return n2; });
      setStatus(`${TURNIP_DAYS[idx]}: ${n} bells`);
      setEditIdx(null);
    } else setStatus('Error: ' + res.error);
    setTimeout(() => setStatus(''), 2000);
  }, [connected]);

  const setAllSell = useCallback(async (val) => {
    if (!connected) return;
    const n = parseInt(val);
    if (isNaN(n) || n < 1 || n > 999) return;
    const hex4 = n.toString(16).padStart(8, '0');
    const le = hex4[6]+hex4[7]+hex4[4]+hex4[5]+hex4[2]+hex4[3]+hex4[0]+hex4[1];
    for (let i = 0; i < 12; i++) {
      const addr = ADDR.TurnipSellBase + i * 4;
      await window.sysbot.poke(hex(addr), '0x' + le);
    }
    await readPrices();
    setStatus(`All sell prices set to ${n} bells`);
    setTimeout(() => setStatus(''), 2000);
  }, [connected, readPrices]);

  return (
    <div className="max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-300 text-sm font-medium">Turnip Prices</h3>
        <button
          onClick={readPrices}
          disabled={!connected || loading}
          className="px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400
                     hover:bg-cyan-900/30 transition-colors disabled:opacity-30"
        >
          {loading ? 'Reading…' : 'Read Prices'}
        </button>
      </div>

      {status && (
        <p className={`text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
          {status}
        </p>
      )}

      {prices && (
        <>
          {/* Buy price */}
          <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Buy Price (Sunday Daisy Mae)</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-amber-400">{prices.buy}</span>
              <span className="text-gray-500 text-sm">bells</span>
              <input
                type="number" min="90" max="110" placeholder="90-110"
                value={editBuy} onChange={e => setEditBuy(e.target.value)}
                className="w-20 px-2 py-1 rounded bg-black border border-gray-700 text-white
                           text-xs focus:outline-none focus:border-amber-700"
              />
              <button
                onClick={writeBuy}
                disabled={!connected || !editBuy}
                className="px-2 py-1 text-xs rounded border border-amber-700 text-amber-400
                           hover:bg-amber-900/30 transition-colors disabled:opacity-30"
              >
                Set
              </button>
            </div>
          </div>

          {/* Sell prices */}
          <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Sell Prices</p>
              <button
                onClick={() => setAllSell('660')}
                disabled={!connected}
                className="px-2 py-0.5 text-xs rounded border border-green-800 text-green-400
                           hover:bg-green-900/30 transition-colors disabled:opacity-30"
              >
                Max All (660)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TURNIP_DAYS.map((day, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-2 py-1.5 rounded bg-black/40 border border-gray-800/60"
                >
                  <span className="text-gray-500 text-xs w-16">{day}</span>
                  {editIdx === i ? (
                    <div className="flex gap-1">
                      <input
                        type="number" min="1" max="999"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && writeSell(i, editVal)}
                        autoFocus
                        className="w-16 px-1 py-0.5 rounded bg-black border border-cyan-700 text-cyan-300
                                   text-xs focus:outline-none"
                      />
                      <button onClick={() => writeSell(i, editVal)}
                        className="text-[10px] text-green-400 px-1">✓</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditIdx(i); setEditVal(String(prices.sell[i])); }}
                      disabled={!connected}
                      className={`text-sm font-bold font-mono hover:text-cyan-300 transition-colors disabled:pointer-events-none ${
                        prices.sell[i] >= 500 ? 'text-green-400' :
                        prices.sell[i] >= 300 ? 'text-amber-400' : 'text-gray-300'
                      }`}
                    >
                      {prices.sell[i]}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!prices && !loading && (
        <p className="text-gray-600 text-xs text-center py-4">
          {connected ? 'Press Read Prices to load.' : 'Connect to Switch first.'}
        </p>
      )}
    </div>
  );
}
