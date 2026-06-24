import { useState, useRef, useEffect, useCallback } from 'react';

const HISTORY_KEY = 'nhle_console_history';

export default function Console({ connected }) {
  const [input, setInput]     = useState('');
  const [lines, setLines]     = useState([
    { type: 'info', text: 'NHLE Console — type raw sys-botbase commands' },
    { type: 'info', text: 'Examples: getTitleID  |  peek 0x00 4  |  click A  |  pixelPeek' },
  ]);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const log = (type, text) => setLines(l => [...l, { type, text }]);

  const send = useCallback(async () => {
    const cmd = input.trim();
    if (!cmd) return;

    log('cmd', `> ${cmd}`);
    setInput('');
    setHistIdx(-1);

    const newHistory = [cmd, ...history.filter(h => h !== cmd)].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

    if (!connected) {
      log('error', 'Not connected to Switch');
      return;
    }

    const res = await window.sysbot.raw(cmd);
    if (res.ok) {
      if (res.data === '(no response)') {
        log('ok', 'OK (no response)');
      } else if (typeof res.data === 'string' && res.data.length > 200) {
        // Long hex — display with line breaks
        const chunks = res.data.match(/.{1,64}/g) || [];
        chunks.forEach(c => log('data', c));
      } else {
        log('data', res.data ?? '(no response)');
      }
    } else {
      log('error', 'Error: ' + res.error);
    }
  }, [input, connected, history]);

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      send();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? '' : history[idx] ?? '');
    }
  };

  const clear = () => setLines([]);

  const lineStyle = {
    cmd:   'text-cyan-300',
    data:  'text-green-300 break-all',
    ok:    'text-gray-400',
    info:  'text-gray-500 italic',
    error: 'text-red-400',
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-cyan-400 font-bold tracking-widest text-sm uppercase">Console</h2>
        <button
          onClick={clear}
          className="px-3 py-1 text-xs rounded border border-gray-800 text-gray-600
                     hover:text-gray-400 hover:border-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Output */}
      <div
        className="flex-1 bg-black rounded-lg border border-gray-800 p-3 overflow-y-auto
                   font-mono text-xs leading-relaxed min-h-0"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, i) => (
          <div key={i} className={lineStyle[line.type] ?? 'text-white'}>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <span className="text-cyan-600 font-mono text-sm shrink-0">&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setHistIdx(-1); }}
          onKeyDown={handleKey}
          placeholder="command…"
          autoFocus
          className="flex-1 px-3 py-2 rounded bg-black border border-gray-700 text-white
                     font-mono text-sm focus:outline-none focus:border-cyan-700"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="px-4 py-2 rounded bg-cyan-900/40 border border-cyan-700 text-cyan-300
                     text-sm hover:bg-cyan-900/60 transition-colors disabled:opacity-30"
        >
          Send
        </button>
      </div>
      <p className="text-gray-700 text-[10px]">
        ↑↓ history · Enter to send · All sys-botbase commands supported
      </p>
    </div>
  );
}
