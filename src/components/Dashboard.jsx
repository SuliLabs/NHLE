import { useState, useCallback } from 'react';

function InfoRow({ label, value, mono = true }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-800/60">
      <span className="text-gray-500 text-xs w-28 shrink-0">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono text-cyan-300' : 'text-white'} truncate`}>
        {value ?? <span className="text-gray-600">—</span>}
      </span>
    </div>
  );
}

export default function Dashboard({ connected }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameName, setGameName] = useState(null);
  const [ver, setVer] = useState(null);

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const [infoRes, nameRes, sbVer] = await Promise.all([
        window.sysbot.getInfo(),
        window.sysbot.game('name'),
        window.sysbot.getVersion(),
      ]);
      if (infoRes.ok) setInfo(infoRes.data);
      if (nameRes.ok) setGameName(nameRes.data);
      if (sbVer.ok) setVer(sbVer.data);
    } finally {
      setLoading(false);
    }
  }, [connected]);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-cyan-400 font-bold tracking-widest text-sm uppercase">Dashboard</h2>
        <button
          onClick={refresh}
          disabled={!connected || loading}
          className="px-3 py-1 text-xs rounded bg-cyan-900/30 border border-cyan-800/60
                     text-cyan-400 hover:bg-cyan-900/60 transition-colors disabled:opacity-30"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Game</p>
        <InfoRow label="Name"         value={gameName} mono={false} />
        <InfoRow label="Title ID"     value={info?.titleId} />
        <InfoRow label="Version"      value={info?.titleVersion} />
        <InfoRow label="Build ID"     value={info?.buildId} />
      </div>

      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Memory</p>
        <InfoRow label="Heap Base"    value={info?.heapBase} />
        <InfoRow label="NSO Main Base"value={info?.mainNsoBase} />
      </div>

      <div className="bg-[#0f0f1a] border border-gray-800 rounded-lg p-4">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">System</p>
        <InfoRow label="Language"     value={info?.language} mono={false} />
        <InfoRow label="Battery"      value={info?.battery} mono={false} />
        <InfoRow label="sys-botbase"  value={ver} />
      </div>

      {!info && !loading && (
        <p className="text-gray-600 text-xs text-center pt-4">
          {connected ? 'Press Refresh to load data.' : 'Connect to the Switch first.'}
        </p>
      )}
    </div>
  );
}
