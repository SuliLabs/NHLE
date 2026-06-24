import { useState, useCallback } from 'react';

function Btn({ label, btn, onPress, onRelease, className = '' }) {
  return (
    <button
      onMouseDown={() => onPress(btn)}
      onMouseUp={() => onRelease(btn)}
      onMouseLeave={() => onRelease(btn)}
      className={`btn-controller ${className}`}
    >
      {label}
    </button>
  );
}

function ClickBtn({ label, btn, onClick, className = '' }) {
  return (
    <button
      onClick={() => onClick(btn)}
      className={`btn-controller ${className}`}
    >
      {label}
    </button>
  );
}

export default function ControllerPad({ connected }) {
  const [held, setHeld] = useState({});
  const [seq, setSeq]   = useState('');
  const [status, setStatus] = useState('');

  const press = useCallback(async (btn) => {
    if (!connected || held[btn]) return;
    setHeld(h => ({...h, [btn]: true}));
    await window.sysbot.press(btn);
  }, [connected, held]);

  const release = useCallback(async (btn) => {
    if (!connected || !held[btn]) return;
    setHeld(h => { const n={...h}; delete n[btn]; return n; });
    await window.sysbot.release(btn);
  }, [connected, held]);

  const click = useCallback(async (btn) => {
    if (!connected) return;
    setHeld(h => ({...h, [btn]: true}));
    await window.sysbot.click(btn);
    setTimeout(() => setHeld(h => { const n={...h}; delete n[btn]; return n; }), 150);
  }, [connected]);

  const sendSeq = useCallback(async () => {
    if (!connected || !seq.trim()) return;
    const res = await window.sysbot.clickSeq(seq.trim());
    setStatus(res.ok ? 'Sequence sent' : 'Error: ' + res.error);
    setTimeout(() => setStatus(''), 2000);
  }, [connected, seq]);

  const btnClass = (btn) => `
    w-10 h-10 text-xs font-bold
    ${held[btn]
      ? 'bg-cyan-600 border-cyan-400 text-white glow-cyan'
      : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-400'
    }
  `;

  const sysBtn = (btn) => `
    w-8 h-8 text-[10px]
    ${held[btn]
      ? 'bg-cyan-600 border-cyan-400 text-white'
      : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800'
    }
  `;

  const faceBtn = (btn, color) => `
    w-10 h-10 text-xs font-bold
    ${held[btn]
      ? `${color} text-white`
      : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
    }
  `;

  return (
    <div className="select-none">
      <h2 className="text-cyan-400 font-bold tracking-widest text-sm uppercase mb-4">Controller</h2>

      <div className="bg-[#0f0f1a] border border-gray-800 rounded-2xl p-6 inline-block">
        <div className="flex items-center gap-16">

          {/* Left side: D-Pad + L stick */}
          <div className="flex flex-col items-center gap-6">
            {/* ZL + L */}
            <div className="flex gap-2">
              <Btn label="ZL" btn="ZL" onPress={press} onRelease={release} className={btnClass('ZL') + ' w-12'} />
              <Btn label="L"  btn="L"  onPress={press} onRelease={release} className={btnClass('L')  + ' w-12'} />
            </div>

            {/* D-Pad */}
            <div className="grid grid-cols-3 gap-1 w-28">
              <div />
              <ClickBtn label="▲" btn="DUP"    onClick={click} className={btnClass('DUP')} />
              <div />
              <ClickBtn label="◀" btn="DLEFT"  onClick={click} className={btnClass('DLEFT')} />
              <div className="w-10 h-10 bg-gray-900/60 rounded-full" />
              <ClickBtn label="▶" btn="DRIGHT" onClick={click} className={btnClass('DRIGHT')} />
              <div />
              <ClickBtn label="▼" btn="DDOWN"  onClick={click} className={btnClass('DDOWN')} />
              <div />
            </div>

            {/* Minus + Screenshot */}
            <div className="flex gap-2">
              <ClickBtn label="−"  btn="MINUS"   onClick={click} className={sysBtn('MINUS')} />
              <ClickBtn label="⬛" btn="CAPTURE" onClick={click} className={sysBtn('CAPTURE')} />
            </div>
          </div>

          {/* Center: LSTICK / Home / RSTICK */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-gray-600 text-[10px] text-center">L STICK</div>
            <ClickBtn label="●" btn="LSTICK" onClick={click}
              className={`w-12 h-12 text-lg ${btnClass('LSTICK')}`} />
            <ClickBtn label="⌂" btn="HOME" onClick={click}
              className={`w-9 h-9 text-base ${sysBtn('HOME')}`} />
            <ClickBtn label="●" btn="RSTICK" onClick={click}
              className={`w-12 h-12 text-lg ${btnClass('RSTICK')}`} />
            <div className="text-gray-600 text-[10px] text-center">R STICK</div>
          </div>

          {/* Right side: Face buttons + R */}
          <div className="flex flex-col items-center gap-6">
            {/* ZR + R */}
            <div className="flex gap-2">
              <Btn label="R"  btn="R"  onPress={press} onRelease={release} className={btnClass('R')  + ' w-12'} />
              <Btn label="ZR" btn="ZR" onPress={press} onRelease={release} className={btnClass('ZR') + ' w-12'} />
            </div>

            {/* ABXY */}
            <div className="grid grid-cols-3 gap-1 w-28">
              <div />
              <ClickBtn label="X" btn="X" onClick={click}
                className={faceBtn('X', 'bg-blue-600 border-blue-400')} />
              <div />
              <ClickBtn label="Y" btn="Y" onClick={click}
                className={faceBtn('Y', 'bg-yellow-600 border-yellow-400')} />
              <div className="w-10 h-10 bg-gray-900/60 rounded-full" />
              <ClickBtn label="A" btn="A" onClick={click}
                className={faceBtn('A', 'bg-red-600 border-red-400')} />
              <div />
              <ClickBtn label="B" btn="B" onClick={click}
                className={faceBtn('B', 'bg-green-700 border-green-500')} />
              <div />
            </div>

            {/* Plus */}
            <div className="flex gap-2">
              <ClickBtn label="⌂" btn="HOME"  onClick={click} className={sysBtn('HOME') + ' invisible'} />
              <ClickBtn label="+"  btn="PLUS"  onClick={click} className={sysBtn('PLUS')} />
            </div>
          </div>
        </div>
      </div>

      {/* Sequence input */}
      <div className="mt-4 bg-[#0f0f1a] border border-gray-800 rounded-lg p-4 space-y-2 max-w-xl">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Button Sequence</p>
        <p className="text-[10px] text-gray-600">
          Format: <span className="text-gray-400">A,W500,B,DDOWN,W200,A</span>
          &nbsp; (W=wait ms, +btn=hold, -btn=release)
        </p>
        <div className="flex gap-2">
          <input
            value={seq}
            onChange={e => setSeq(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendSeq()}
            placeholder="A,W1000,B,W200,DUP"
            className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white
                       text-sm focus:outline-none focus:border-cyan-600 font-mono"
          />
          <button
            onClick={sendSeq}
            disabled={!connected || !seq.trim()}
            className="px-4 py-1.5 rounded bg-cyan-900/40 border border-cyan-700 text-cyan-300
                       text-sm hover:bg-cyan-900/60 transition-colors disabled:opacity-30"
          >
            Send
          </button>
        </div>
        {status && (
          <p className={`text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {status}
          </p>
        )}
      </div>

      <p className="text-gray-700 text-[10px] mt-3">
        Hold = hold button | Click = press &amp; release | Sticks = click the stick button
      </p>
    </div>
  );
}
