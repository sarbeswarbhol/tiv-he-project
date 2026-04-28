import { useEffect, useState } from 'react';
import { FiX, FiCamera, FiHash, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import BarcodeScanner from "react-qr-barcode-scanner";

export default function ScannerModal({ onScan, onClose }) {
  const [mode, setMode] = useState('camera');
  const [manualInput, setManualInput] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = (text) => {
    if (!text || !isScanning) return;

    const raw = String(text).trim();
    if (!raw) return;

    setIsScanning(false);
    setScannedResult(raw);

    toast.success('QR scanned!');
    onScan({ type: 'secure_token', value: raw });
  };

  const handleError = (error) => {
    console.error('QR Scanner error:', error);
  };

  useEffect(() => {
    if (mode === 'camera') {
      setIsScanning(true);
      setScannedResult(null);
    }
  }, [mode]);

  const submitManual = () => {
    const val = manualInput.trim();
    if (!val) {
      toast.error('Enter a Manual ID or token');
      return;
    }

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

        <h2 className="font-display text-lg font-bold neon-text mb-1">
          Scan / Enter Token
        </h2>
        <p className="font-mono text-xs text-slate-500 mb-5">
          Camera scan or Manual ID entry
        </p>

        {/* MODE SWITCH */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2.5 rounded-xl font-mono text-xs flex items-center justify-center gap-1.5
              ${mode === 'camera' ? 'btn-solid' : 'btn-neon'}`}
          >
            <FiCamera size={13} /> Scan QR
          </button>

          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2.5 rounded-xl font-mono text-xs flex items-center justify-center gap-1.5
              ${mode === 'manual' ? 'btn-solid' : 'btn-neon'}`}
          >
            <FiHash size={13} /> Manual ID
          </button>
        </div>

        {/* CAMERA MODE */}
        {mode === 'camera' ? (
          <div className="relative">

            <div className="rounded-2xl overflow-hidden"
              style={{
                background: '#060d14',
                border: '1px solid rgba(0,212,255,0.2)',
                aspectRatio: '4/3'
              }}>

              <BarcodeScanner
                onUpdate={(err, result) => {
                  if (result?.getText()) {
                    handleScan(result.getText());
                  }
                  if (err) handleError(err);
                }}
                constraints={{
                  video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }
                }}
                delay={200}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* SCAN BOX */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div style={{
                  width: 200,
                  height: 200,
                  border: '2px solid rgba(0,212,255,0.6)',
                  borderRadius: 12,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                }} />
              </div>
            </div>

            {!scannedResult && (
              <p className="font-mono text-xs text-slate-500 text-center mt-2">
                Hold QR steady inside the box
              </p>
            )}

            {scannedResult && (
              <div className="mt-3 rounded-xl p-3 flex items-start gap-2"
                style={{
                  background: 'rgba(0,212,255,0.05)',
                  border: '1px solid rgba(0,212,255,0.2)'
                }}>
                <FiCheckCircle size={14} className="text-cyan-400 mt-0.5" />
                <code className="font-mono text-xs text-slate-300 break-all">
                  {scannedResult}
                </code>
              </div>
            )}
          </div>
        ) : (

          /* MANUAL MODE */
          <div className="space-y-4">
            <input
              type="text"
              value={manualInput}
              onChange={handleManualChange}
              onKeyDown={e => e.key === 'Enter' && submitManual()}
              placeholder="A1B2"
              className="input-cyber w-full px-4 py-3 rounded-xl font-mono text-xl text-center"
              autoFocus
            />

            <button
              onClick={submitManual}
              className="btn-solid w-full py-3.5 rounded-xl font-mono text-sm"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}