import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { FiX, FiRefreshCw, FiCopy, FiCheck, FiInfo, FiKey, FiDownload } from 'react-icons/fi';
import api from '../../api/axios';

const TIMER_MAX = 180;

export default function QRModal({ credential, onClose }) {
  const [qrUrl, setQrUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_MAX);
  const [expired, setExpired] = useState(false);
  const [copiedManual, setCopiedManual] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentToken, setCurrentToken] = useState(credential?.secure_token || '');
  const [currentManualId, setCurrentManualId] = useState(credential?.manual_id || '');
  const intervalRef = useRef(null);
  // Hidden canvas used for PNG download
  const canvasRef = useRef(null);

  const generateQR = async (token) => {
    if (!token) { toast.error('No secure token available'); return; }
    try {
      // Render to the hidden canvas so we can export it as PNG
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, token, {
          width: 280,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'H',
        });
      }
      // Also keep a data-URL for the <img> preview
      const url = await QRCode.toDataURL(token, {
        width: 280, margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setQrUrl(url);
    } catch (err) {
      toast.error('Failed to generate QR code');
    }
  };

  const startTimer = () => {
    setTimeLeft(TIMER_MAX);
    setExpired(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (currentToken) { generateQR(currentToken); startTimer(); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const regenerate = async () => {
    if (!credential?.credential_id) return;
    setRefreshing(true);
    try {
      const res = await api.post(`/holder/credentials/${credential.credential_id}/refresh`);
      const { secure_token, manual_id } = res.data;
      if (!secure_token) { toast.error('No secure token received'); return; }
      setCurrentToken(secure_token);
      setCurrentManualId(manual_id || currentManualId);
      await generateQR(secure_token);
      startTimer();
      toast.success('Token refreshed — new QR ready');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to refresh token');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Download the QR code as a PNG file — mirrors the reference component's downloadQR().
   * We use the hidden <canvas> (populated by QRCode.toCanvas) to get a lossless PNG.
   */
  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) { toast.error('QR not ready yet'); return; }
    try {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `credential-qr-${currentManualId || 'code'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR image downloaded');
    } catch {
      toast.error('Failed to download QR');
    }
  };

  const copyManualId = () => {
    if (!currentManualId) return;
    navigator.clipboard.writeText(currentManualId);
    setCopiedManual(true);
    toast.success('Manual ID copied');
    setTimeout(() => setCopiedManual(false), 2000);
  };

  const copyToken = () => {
    if (!currentToken) return;
    navigator.clipboard.writeText(currentToken);
    setCopiedToken(true);
    toast.success('Secure token copied');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const formatTime = (s) => ({
    mins: String(Math.floor(s / 60)).padStart(2, '0'),
    secs: String(s % 60).padStart(2, '0'),
  });

  const { mins, secs } = formatTime(timeLeft);
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (timeLeft / TIMER_MAX);
  const timerColor = timeLeft > 60 ? '#00d4ff' : timeLeft > 20 ? '#f59e0b' : '#ff5555';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="glass rounded-3xl p-6 max-w-md w-full relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[95vh]"
        style={{ boxShadow: '0 0 60px rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.2)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
        >
          <FiX size={18} />
        </button>

        <h2 className="font-display text-xl font-bold neon-text tracking-wider mb-1 text-center">
          Verification QR Code
        </h2>
        <p className="font-mono text-xs text-slate-500 text-center mb-6">
          Present this QR to the verifier
        </p>

        {/* Hidden canvas for PNG export — not visible to user */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* QR Code */}
        <div className="relative flex justify-center mb-4">
          <div
            className={`rounded-2xl overflow-hidden transition-all ${expired ? 'opacity-40 grayscale' : ''}`}
            style={{ border: `2px solid ${timerColor}44`, background: '#060d14', padding: '12px' }}
          >
            {qrUrl ? (
              <img src={qrUrl} alt="Verification QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-slate-800 rounded-2xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Generating QR…</p>
                </div>
              </div>
            )}
          </div>

          {expired && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ background: 'rgba(2,4,8,0.9)' }}
            >
              <div className="font-display text-2xl font-black text-red-400 mb-3">EXPIRED</div>
              <button
                onClick={regenerate}
                disabled={refreshing}
                className="btn-neon px-5 py-2.5 rounded-xl font-mono text-sm flex items-center gap-2"
              >
                <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing…' : 'Generate New'}
              </button>
            </div>
          )}
        </div>

        {/* Download button — shown only when QR is ready and not expired */}
        {qrUrl && !expired && (
          <div className="flex justify-center mb-4">
            <button
              onClick={downloadQR}
              className="flex items-center gap-1.5 font-mono text-xs text-slate-400 hover:text-cyan-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-cyan-300/10"
            >
              <FiDownload size={13} />
              Download QR as PNG
            </button>
          </div>
        )}

        {/* Timer */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <svg width={80} height={80} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke={timerColor} strokeWidth="6"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
            />
            <text x="50" y="52" textAnchor="middle" fill={timerColor}
              fontSize="18" fontWeight="bold" fontFamily="monospace">
              {mins}:{secs}
            </text>
          </svg>
          <div className="flex flex-col">
            <span className="font-mono text-xs text-slate-500">QR Valid For</span>
            <span className="font-mono text-sm text-slate-300">3 minutes</span>
            {!expired && (
              <button
                onClick={regenerate}
                disabled={refreshing}
                className="mt-1 font-mono text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <FiRefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing…' : 'Refresh early'}
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-slate-900 text-slate-500 font-mono text-xs">MANUAL FALLBACK</span>
          </div>
        </div>

        {/* Manual ID */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FiInfo size={12} className="text-cyan-400" />
            <span className="font-mono text-xs text-slate-400">
              If QR can't be scanned, give verifier this{' '}
              <strong className="text-cyan-300">Manual ID</strong>
            </span>
          </div>

          <div
            className="glass rounded-xl p-4"
            style={{ borderColor: 'rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.04)' }}
          >
            <div className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-2">
              Manual ID (4-digit)
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-3xl font-black text-cyan-300 tracking-[0.5em] text-center bg-slate-800/60 px-4 py-3 rounded-lg">
                {currentManualId || '——'}
              </code>
              {currentManualId && (
                <button
                  onClick={copyManualId}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                    copiedManual
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-300/10'
                  }`}
                >
                  {copiedManual ? <FiCheck size={18} /> : <FiCopy size={18} />}
                </button>
              )}
            </div>
            <p className="font-mono text-xs text-slate-600 mt-2 text-center">
              Verifier enters this in the "Manual ID" tab
            </p>
          </div>

          {/* Secure token copy */}
          <div className="glass rounded-xl p-3" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <FiKey size={11} className="text-slate-500" />
                <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">
                  Secure Token
                </span>
              </div>
              {currentToken && (
                <button
                  onClick={copyToken}
                  className={`p-1.5 rounded-lg transition-all ${
                    copiedToken
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-slate-500 hover:text-cyan-300 hover:bg-cyan-300/10'
                  }`}
                >
                  {copiedToken ? <FiCheck size={14} /> : <FiCopy size={14} />}
                </button>
              )}
            </div>
            <code className="font-mono text-xs text-slate-400 break-all line-clamp-2">
              {currentToken ? `${currentToken.slice(0, 48)}…` : '—'}
            </code>
          </div>
        </div>

        {/* Hint */}
        <div className="mt-5 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
          <p className="font-mono text-xs text-slate-400 text-center">
            📱 <span className="text-cyan-300">Verifier:</span> scan QR{' '}
            <span className="text-slate-600">or</span> enter Manual ID{' '}
            <strong className="text-cyan-300 tracking-widest">{currentManualId || '—'}</strong>
          </p>
        </div>

        <button onClick={onClose} className="mt-4 w-full btn-neon py-2.5 rounded-xl font-mono text-sm">
          Close
        </button>
      </div>
    </div>
  );
}