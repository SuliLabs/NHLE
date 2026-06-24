export default function ConnectionPanel({
  host, setHost, port, setPort,
  connected, connecting, onConnect, onDisconnect,
}) {
  const handleKey = (e) => {
    if (e.key === 'Enter' && !connected && !connecting) onConnect();
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={host}
        onChange={e => setHost(e.target.value)}
        onKeyDown={handleKey}
        placeholder="192.168.1.x"
        disabled={connected || connecting}
        className="w-36 px-2 py-1 text-xs rounded bg-gray-900 border border-gray-700
                   text-cyan-300 placeholder-gray-600 focus:outline-none focus:border-cyan-600
                   disabled:opacity-40"
      />
      <input
        type="text"
        value={port}
        onChange={e => setPort(e.target.value)}
        onKeyDown={handleKey}
        placeholder="6000"
        disabled={connected || connecting}
        className="w-16 px-2 py-1 text-xs rounded bg-gray-900 border border-gray-700
                   text-cyan-300 placeholder-gray-600 focus:outline-none focus:border-cyan-600
                   disabled:opacity-40"
      />
      {connected ? (
        <button
          onClick={onDisconnect}
          className="px-3 py-1 text-xs rounded bg-red-900/50 border border-red-700
                     text-red-300 hover:bg-red-800/60 transition-colors"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={onConnect}
          disabled={connecting}
          className="px-3 py-1 text-xs rounded bg-cyan-900/50 border border-cyan-700
                     text-cyan-300 hover:bg-cyan-800/60 transition-colors disabled:opacity-40"
        >
          {connecting ? 'Connecting…' : 'Connect'}
        </button>
      )}
    </div>
  );
}
