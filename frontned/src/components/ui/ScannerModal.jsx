import { useEffect, useRef, useState } from 'react';
import { FiX, FiCamera, FiHash, FiAlertTriangle, FiLock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

/**
 * onScan({ type: 'secure_token'|'manual_id', value }) called on success.
 *
 * Architecture:
 *  - getUserMedia → <video> on main thread (display only)
 *  - setInterval at 10fps → drawImage onto offscreen canvas → getImageData
 *  - ImageData posted to Web Worker running jsQR (off main thread)
 *  - Worker posts back the decoded string
 *
 * This keeps the main thread free (no more rAF violations).
 * Requires /public/qr-worker.js to be present (see separate file).
 */
export default function ScannerModal({ onScan, onClose }) {
  const [mode, setMode] = useState('camera');
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);   // offscreen, never shown
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const timerRef  = useRef(null);
  const busyRef   = useRef(false);  // prevent overlapping worker calls
  const activeRef = useRef(false);

  // ── camera + worker setup ────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'camera') return;

    const isSecure =
      location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1';

    if (!isSecure) { setCameraError('https'); return; }

    setCameraError(null);
    setCameraReady(false);
    setScannedResult(null);
    activeRef.current = true;
    busyRef.current = false;

    // Spawn worker
    const worker = new Worker('/qr-worker.js');
    workerRef.current = worker;

    worker.onmessage = ({ data: { result } }) => {
      busyRef.current = false;
      if (!activeRef.current || !result) return;

      const raw = result.trim();
      if (!raw) return;

      // Stop everything
      cleanup();
      toast.success('QR scanned!');
      setScannedResult(raw);
      onScan({ type: 'secure_token', value: raw });
    };

    // Start camera
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 640 },   // smaller = faster decode
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', true);
        await video.play();

        setCameraReady(true);

        // 10fps capture loop — vastly cheaper than rAF
        timerRef.current = setInterval(() => {
          if (!activeRef.current || busyRef.current) return;

          const v = videoRef.current;
          const c = canvasRef.current;
          if (!v || !c || v.readyState < v.HAVE_ENOUGH_DATA) return;

          const w = v.videoWidth;
          const h = v.videoHeight;
          if (!w || !h) return;

          c.width  = w;
          c.height = h;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(v, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);

          // Transfer the pixel buffer to the worker (zero-copy)
          busyRef.current = true;
          workerRef.current.postMessage(
            { pixels: imageData.data, width: w, height: h },
            [imageData.data.buffer]   // transferable — no copy
          );
        }, 100); // 10fps

      } catch (err) {
        if (!activeRef.current) return;
        const msg = (err?.message || String(err)).toLowerCase();
        if (msg.includes('permission') || msg.includes('denied') || msg.includes('not allowed')) {
          setCameraError('permission');
        } else if (msg.includes('https') || msg.includes('secure')) {
          setCameraError('https');
        } else {
          setCameraError('unavailable');
        }
      }
    })();

    return cleanup;
  }, [mode]);

  const cleanup = () => {
    activeRef.current = false;
    clearInterval(timerRef.current);
    timerRef.current = null;
    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  // ── manual submit ─────────────────────────────────────────────────────────
  const submitManual = () => {
    const val = manualInput.trim();
    if (!val) { toast.error('Enter a Manual ID or token'); return; }
    const type = val.length <= 8 ? 'manual_id' : 'secure_token';
    toast.success(type === 'manual_id' ? 'Manual ID submitted' : 'Token submitted');
    onScan({ type, value: val });
  };

  const handleManualChange = (e) => {
    const raw = e.target.value;
    setManualInput(raw.length <= 8 ? raw.toUpperCase() : raw);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass rounded-3xl p-6 max-w-sm w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white p-1.5">
          <FiX size={18} />
        </button>

        <h2 className="font-display text-lg font-bold neon-text mb-1">Scan / Enter Token</h2>
        <p className="font-mono text-xs text-slate-500 mb-5">Camera scan or Manual ID entry</p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => { setCameraError(null); setScannedResult(null); setMode('camera'); }}
            className={`flex-1 py-2.5 rounded-xl font-mono text-xs flex items-center justify-center gap-1.5 transition-all
              ${mode === 'camera' ? 'btn-solid' : 'btn-neon'}`}
          >
            <FiCamera size={13} /> Scan QR
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2.5 rounded-xl font-mono text-xs flex items-center justify-center gap-1.5 transition-all
              ${mode === 'manual' ? 'btn-solid' : 'btn-neon'}`}
          >
            <FiHash size={13} /> Manual ID
          </button>
        </div>

        {mode === 'camera' ? (
          cameraError ? (
            <div className="rounded-2xl p-6 text-center space-y-4"
              style={{ background: 'rgba(255,85,85,0.05)', border: '1px solid rgba(255,85,85,0.2)' }}>
              {cameraError === 'https' && (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto">
                    <FiLock size={28} className="text-amber-400" />
                  </div>
                  <p className="font-mono text-sm font-bold text-amber-300">Secure Context Required</p>
                  <p className="font-mono text-xs text-slate-400 leading-relaxed">
                    Open via <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">localhost</code> not an IP address.
                  </p>
                </>
              )}
              {cameraError === 'permission' && (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-red-400/10 flex items-center justify-center mx-auto">
                    <FiAlertTriangle size={28} className="text-red-400" />
                  </div>
                  <p className="font-mono text-sm font-bold text-red-300">Camera Permission Denied</p>
                  <p className="font-mono text-xs text-slate-400 leading-relaxed">
                    Allow camera access in your browser's address bar, then try again.
                  </p>
                </>
              )}
              {cameraError === 'unavailable' && (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-slate-400/10 flex items-center justify-center mx-auto">
                    <FiCamera size={28} className="text-slate-400" />
                  </div>
                  <p className="font-mono text-sm font-bold text-slate-300">No Camera Found</p>
                  <p className="font-mono text-xs text-slate-400">No camera is available on this device.</p>
                </>
              )}
              <button onClick={() => setMode('manual')} className="btn-neon w-full py-2.5 rounded-xl font-mono text-sm mt-2">
                Use Manual ID Instead
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="rounded-2xl overflow-hidden"
                style={{ background: '#060d14', border: '1px solid rgba(0,212,255,0.2)', aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  muted playsInline
                  className="w-full h-full object-cover"
                  style={{ display: cameraReady ? 'block' : 'none' }}
                />
                {/* Scan-box crosshair */}
                {cameraReady && !scannedResult && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div style={{
                      width: 200, height: 200,
                      border: '2px solid rgba(0,212,255,0.6)',
                      borderRadius: 12,
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                    }}>
                      {[
                        { top: -2, left: -2, borderTop: '3px solid #00d4ff', borderLeft: '3px solid #00d4ff', borderRadius: '10px 0 0 0' },
                        { top: -2, right: -2, borderTop: '3px solid #00d4ff', borderRight: '3px solid #00d4ff', borderRadius: '0 10px 0 0' },
                        { bottom: -2, left: -2, borderBottom: '3px solid #00d4ff', borderLeft: '3px solid #00d4ff', borderRadius: '0 0 0 10px' },
                        { bottom: -2, right: -2, borderBottom: '3px solid #00d4ff', borderRight: '3px solid #00d4ff', borderRadius: '0 0 10px 0' },
                      ].map((s, i) => (
                        <div key={i} className="absolute" style={{ width: 20, height: 20, ...s }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden offscreen canvas — never rendered visually */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-2xl" style={{ minHeight: 260 }}>
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent mx-auto mb-2" />
                    <p className="font-mono text-xs text-slate-400">Starting camera…</p>
                  </div>
                </div>
              )}

              {cameraReady && !scannedResult && (
                <p className="font-mono text-xs text-slate-500 text-center mt-2">
                  Hold QR code steady inside the box
                </p>
              )}

              {scannedResult && (
                <div className="mt-3 rounded-xl p-3 flex items-start gap-2"
                  style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <FiCheckCircle size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-cyan-300 mb-1">Scanned successfully</p>
                    <code className="font-mono text-xs text-slate-300 break-all line-clamp-2">
                      {scannedResult.length > 60 ? `${scannedResult.slice(0, 60)}…` : scannedResult}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="space-y-4">
            <label className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-2 block">
              Manual ID (6 chars) or full secure token
            </label>
            <input
              type="text"
              value={manualInput}
              onChange={handleManualChange}
              onKeyDown={e => e.key === 'Enter' && submitManual()}
              placeholder="A1B2C3"
              maxLength={512}
              className="input-cyber w-full px-4 py-3 rounded-xl font-mono text-xl tracking-[0.4em] text-center"
              autoFocus
            />
            <p className="font-mono text-xs text-slate-600 text-center">
              {manualInput.length === 0
                ? <>Enter the 6-char code or paste the full secure token</>
                : manualInput.trim().length <= 8
                ? <span className="text-cyan-500/70">Manual ID — {manualInput.trim().length}/6 chars</span>
                : <span className="text-slate-500">Full secure token ({manualInput.trim().length} chars)</span>
              }
            </p>
            <button onClick={submitManual} className="btn-solid w-full py-3.5 rounded-xl font-mono text-sm">
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}