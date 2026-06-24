import { useState, useCallback, useEffect, useRef } from 'react';

export default function ScreenViewer({ connected }) {
  const [imgSrc, setImgSrc]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [autoRefresh, setAuto]  = useState(false);
  const [fps, setFps]           = useState(0);
  const intervalRef             = useRef(null);
  const lastTimeRef             = useRef(0);

  const capture = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    setError('');
    const res = await window.sysbot.pixelPeek();
    setLoading(false);
    if (res.ok && res.data) {
      const now = Date.now();
      if (lastTimeRef.current) {
        setFps(Math.round(1000 / (now - lastTimeRef.current)));
      }
      lastTimeRef.current = now;
      setImgSrc(`data:image/jpeg;base64,${res.data}`);
    } else {
      setError(res.error ?? 'Failed to capture screen');
    }
  }, [connected]);

  useEffect(() => {
    if (autoRefresh && connected) {
      intervalRef.current = setInterval(capture, 200);
    } else {
      clearInterval(intervalRef.current);
      setFps(0);
      lastTimeRef.current = 0;
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, connected, capture]);

  useEffect(() => {
    if (!connected) {
      setAuto(false);
      clearInterval(intervalRef.current);
    }
  }, [connected]);

  const save = () => {
    if (!imgSrc) return;
    const a = document.createElement('a');
    a.href = imgSrc;
    a.download = `switch_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-cyan-400 font-bold tracking-widest text-sm uppercase">Screen Capture</h2>
        <div className="flex items-center gap-2">
          {autoRefresh && fps > 0 && (
            <span className="text-xs text-gray-500">{fps} fps</span>
          )}
          <button
            onClick={() => setAuto(v => !v)}
            disabled={!connected}
            className={`px-3 py-1 text-xs rounded border transition-colors disabled:opacity-30 ${
              autoRefresh
                ? 'bg-amber-900/40 border-amber-700 text-amber-300'
                : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {autoRefresh ? 'Stop Auto' : 'Auto Refresh'}
          </button>
          <button
            onClick={capture}
            disabled={!connected || loading}
            className="px-3 py-1 text-xs rounded bg-cyan-900/40 border border-cyan-700
                       text-cyan-300 hover:bg-cyan-900/60 transition-colors disabled:opacity-30"
          >
            {loading ? 'Capturing…' : 'Capture'}
          </button>
          {imgSrc && (
            <button
              onClick={save}
              className="px-3 py-1 text-xs rounded border border-gray-700 text-gray-400
                         hover:border-gray-500 transition-colors"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="bg-black rounded-xl border border-gray-800 overflow-hidden"
           style={{ aspectRatio: '16/9', maxWidth: '100%' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Switch screen"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-sm">
            {connected
              ? 'Press "Capture" to take a screenshot'
              : 'Connect to the Switch first'
            }
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => window.sysbot.screenOn()}
          disabled={!connected}
          className="px-3 py-1 text-xs rounded border border-gray-700 text-gray-400
                     hover:border-green-700 hover:text-green-400 transition-colors disabled:opacity-30"
        >
          Screen On
        </button>
        <button
          onClick={() => window.sysbot.screenOff()}
          disabled={!connected}
          className="px-3 py-1 text-xs rounded border border-gray-700 text-gray-400
                     hover:border-gray-500 transition-colors disabled:opacity-30"
        >
          Screen Off
        </button>
        <span className="text-gray-700 text-xs">Switch display: 1280×720</span>
      </div>
    </div>
  );
}
