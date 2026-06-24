import { useState, useEffect } from 'react';
import ACNHInventory from './ACNHInventory';
import ACNHCheats from './ACNHCheats';
import ACNHTurnips from './ACNHTurnips';
import ACNHMisc from './ACNHMisc';
import ACNHDrop from './ACNHDrop';

const SUBTABS = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'drop',      label: 'Drop' },
  { id: 'cheats',    label: 'Cheats' },
  { id: 'turnips',   label: 'Turnips' },
  { id: 'misc',      label: 'Misc' },
];

// Addresses in acnh.js were calibrated for ACNH 3.0.3
const KNOWN_GOOD_VERSIONS = ['3.0.3'];

export default function ACNHPanel({ connected }) {
  const [tab, setTab]           = useState('inventory');
  const [gameVersion, setGameVersion] = useState(null);

  useEffect(() => {
    if (!connected) { setGameVersion(null); return; }
    window.sysbot.game('version').then(r => {
      if (r.ok) setGameVersion(r.data);
    });
  }, [connected]);

  const versionOk = !gameVersion || KNOWN_GOOD_VERSIONS.some(p => gameVersion.startsWith(p));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <h2 className="text-cyan-400 font-bold tracking-widest text-sm uppercase">
          ACNH
        </h2>
        {gameVersion && (
          <span className="text-gray-600 text-xs font-mono">v{gameVersion}</span>
        )}
        <div className="flex gap-1">
          {SUBTABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                tab === t.id
                  ? 'bg-cyan-900/40 border-cyan-700 text-cyan-300'
                  : 'border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!versionOk && (
        <div className="px-3 py-2 bg-amber-900/20 border border-amber-700/50 rounded text-amber-400 text-xs leading-relaxed">
          <strong>Address mismatch:</strong> ACNH v{gameVersion} detected. The memory addresses built into NHLE were calibrated for <strong>v3.0.3</strong>. Inventory, cheats, turnips, and coordinates may not work correctly on other versions.
        </div>
      )}

      {tab === 'inventory' && <ACNHInventory connected={connected} />}
      {tab === 'drop'      && <ACNHDrop      connected={connected} />}
      {tab === 'cheats'    && <ACNHCheats    connected={connected} />}
      {tab === 'turnips'   && <ACNHTurnips   connected={connected} />}
      {tab === 'misc'      && <ACNHMisc      connected={connected} />}
    </div>
  );
}
