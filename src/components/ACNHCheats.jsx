import { useState, useCallback } from 'react';
import { ADDR, SPEED, PHYSICS } from '../data/acnh.js';

function hex(n) { return '0x' + n.toString(16).toUpperCase(); }

function CheatRow({ label, desc, onEnable, onDisable, connected, active, setActive, id }) {
  const isOn = active === id;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800/60">
      <div>
        <div className="text-white text-sm">{label}</div>
        {desc && <div className="text-gray-600 text-xs">{desc}</div>}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={async () => { await onEnable(); setActive(id); }}
          disabled={!connected}
          className={`px-3 py-1 text-xs rounded border transition-colors disabled:opacity-30 ${
            isOn
              ? 'bg-green-900/40 border-green-600 text-green-400'
              : 'border-gray-700 text-gray-400 hover:border-green-700 hover:text-green-400'
          }`}
        >
          ON
        </button>
        <button
          onClick={async () => { await onDisable(); if (isOn) setActive(null); }}
          disabled={!connected}
          className="px-3 py-1 text-xs rounded border border-gray-700 text-gray-500
                     hover:border-red-700 hover:text-red-400 transition-colors disabled:opacity-30"
        >
          OFF
        </button>
      </div>
    </div>
  );
}

export default function ACNHCheats({ connected }) {
  const [active, setActive] = useState(null);
  const [speedVal, setSpeedVal] = useState('x3');
  const [status, setStatus] = useState('');

  const pm = (addr, val) => window.sysbot.pokeMain(hex(addr), `0x${val}`);
  const p  = (addr, val) => window.sysbot.poke(hex(addr), `0x${val}`);

  const ok = (label) => { setStatus(`${label} applied`); setTimeout(() => setStatus(''), 2000); };

  return (
    <div className="max-w-lg space-y-4">
      {status && (
        <div className="px-3 py-1.5 bg-green-900/20 border border-green-800/40 rounded text-green-400 text-xs">
          {status}
        </div>
      )}

      {/* Walk Speed */}
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4 opacity-50">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Walk Speed</p>
          <span className="text-[9px] text-amber-500 border border-amber-800 rounded px-1">address unknown for 3.0.2</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.keys(SPEED).map(k => (
            <button
              key={k}
              disabled
              className="px-3 py-1.5 text-xs rounded border border-gray-700 text-gray-600 cursor-not-allowed"
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Physics */}
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Physics</p>

        <CheatRow
          id="collision" label="No Collision"
          desc="Walk through walls and objects — ✓ confirmed 3.0.2"
          connected={connected} active={active} setActive={setActive}
          onEnable={async () => { await pm(ADDR.Collision, PHYSICS.collisionOff); await pm(ADDR.ActorCollision, PHYSICS.actorColOff); ok('No Collision'); }}
          onDisable={async () => { await pm(ADDR.Collision, PHYSICS.collisionOn); await pm(ADDR.ActorCollision, PHYSICS.actorColOn); ok('Collision restored'); }}
        />
        <div className="opacity-50">
          <CheatRow
            id="jump" label="Super Jump"
            desc="address unknown for 3.0.2"
            connected={false} active={null} setActive={() => {}}
            onEnable={async () => {}}
            onDisable={async () => {}}
          />
          <CheatRow
            id="swim" label="Fast Swim + Infinite Dive"
            desc="address unknown for 3.0.2"
            connected={false} active={null} setActive={() => {}}
            onEnable={async () => {}}
            onDisable={async () => {}}
          />
        </div>
      </div>

      {/* Time & Shop */}
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Time & Shop</p>

        <CheatRow
          id="time" label="Freeze Time"
          desc="Stop the in-game clock — ✓ confirmed 3.0.2"
          connected={connected} active={active} setActive={setActive}
          onEnable={async () => { await pm(ADDR.FreezeTime, PHYSICS.freezeTime); ok('Time Frozen'); }}
          onDisable={async () => { await pm(ADDR.FreezeTime, PHYSICS.unfreezeTime); ok('Time Unfrozen'); }}
        />
        <div className="opacity-50">
          <CheatRow
            id="shop" label="Shop Always Open"
            desc="address unknown for 3.0.2"
            connected={false} active={null} setActive={() => {}}
            onEnable={async () => {}}
            onDisable={async () => {}}
          />
        </div>
      </div>
    </div>
  );
}
