import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Spinner, EmptyState, SectionHeader, ResultIndicator } from '../../components/ui/index';
import ScannerModal from '../../components/ui/ScannerModal';
import { FiSearch, FiCheck, FiChevronRight, FiGrid, FiHash, FiRefreshCw, FiX } from 'react-icons/fi';

/**
 * CONDITIONS
 *
 * The backend validates conditions against this regex:
 *   ^(age|tax_compliance|license_validity|citizenship_status)\s*(==|=|>=|<=|>|<)\s*(\d+|true|false|[a-z_]+)$
 *
 * So the `value` here must be exactly that string, lowercased.
 */
const CONDITIONS = [
  {
    id: 'age_gte_18',
    label: 'Age ≥ 18',
    icon: '🎂',
    desc: 'Holder is 18 or older',
    value: 'age >= 18',
  },
  {
    id: 'citizenship',
    label: 'Citizenship',
    icon: '🏛️',
    desc: 'Is a citizen',
    value: 'citizenship_status == citizen',
  },
  {
    id: 'license_valid',
    label: 'License Valid',
    icon: '🪪',
    desc: 'Has a valid driving license',
    value: 'license_validity == true',
  },
  {
    id: 'tax_compliant',
    label: 'Tax Compliant',
    icon: '📋',
    desc: 'Tax records are compliant',
    value: 'tax_compliance == true',
  },
];

// Step indicator
function StepBar({ step }) {
  const steps = ['Condition', 'Token', 'Result'];
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-mono text-xs font-bold transition-all
              ${done ? 'bg-green-400/20 text-green-400 border border-green-400/40' :
                active ? 'border border-cyan-400 text-cyan-400 bg-cyan-400/10' :
                'border border-slate-700 text-slate-600'}`}>
              {done ? <FiCheck size={14} /> : idx}
            </div>
            <span className={`font-mono text-xs hidden sm:block ${active ? 'text-cyan-300' : done ? 'text-green-400' : 'text-slate-600'}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <FiChevronRight size={14} className={`mx-1 ${done ? 'text-green-400/50' : 'text-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function VerifyFlow() {
  const [step, setStep] = useState(1);
  const [condition, setCondition] = useState(null);
  // tokenPayload: { type: 'secure_token'|'manual_id', value: string }
  const [tokenPayload, setTokenPayload] = useState(null);
  const [inputMode, setInputMode] = useState('scan');
  const [manualInput, setManualInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Called by ScannerModal with a typed payload
  const handleScan = (payload) => {
    setTokenPayload(payload);
    setShowScanner(false);
    toast.success(payload.type === 'manual_id' ? 'Manual ID captured' : 'Token captured from QR');
  };

  const handleManualSubmit = () => {
    const val = manualInput.trim();
    if (!val) { toast.error('Enter a Manual ID or token'); return; }
    // Same heuristic as ScannerModal
    const type = val.length <= 8 ? 'manual_id' : 'secure_token';
    setTokenPayload({ type, value: val });
  };

  const verify = async () => {
    if (!tokenPayload?.value) { toast.error('Scan a QR or enter a token first'); return; }
    if (!condition) { toast.error('Please select a condition'); return; }

    setLoading(true);
    try {
      // Build payload based on what kind of token we have
      const payload = {
        conditions: [condition.value],  // backend expects the full condition string
        ...(tokenPayload.type === 'manual_id'
          ? { manual_id: tokenPayload.value }
          : { secure_token: tokenPayload.value }),
      };

      const res = await api.post('/verifier/verify', payload);
      setResult(res.data);
      setStep(3);
      toast.success('Verification completed!');
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (Array.isArray(detail)) {
        toast.error(detail[0]?.msg || 'Validation failed');
      } else {
        toast.error(detail || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setCondition(null);
    setTokenPayload(null);
    setManualInput('');
    setResult(null);
    setInputMode('scan');
  };

  // Derived: overall condition result from the results array
  const conditionResult = result?.results?.find(r => r.condition === condition?.value)?.result
    ?? result?.overall_result;

  return (
    <div className="max-w-2xl mx-auto">
      <SectionHeader title="Verify Identity" subtitle="Zero-knowledge proof verification on blockchain" />
      <StepBar step={step} />

      {/* ── Step 1: Select condition ── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-4">Select verification condition</p>
          <div className="grid gap-3 md:grid-cols-2">
            {CONDITIONS.map(c => (
              <button key={c.id} onClick={() => { setCondition(c); setStep(2); }}
                className="glass glass-hover text-left rounded-2xl p-5 flex items-center gap-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <div className="font-mono text-sm font-semibold text-slate-200">{c.label}</div>
                  <div className="font-mono text-xs text-slate-500 mt-0.5">{c.desc}</div>
                  <div className="font-mono text-xs text-cyan-600 mt-1">{c.value}</div>
                </div>
                <FiChevronRight className="ml-auto text-slate-600" size={16} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Input token ── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Selected condition */}
          <div className="glass rounded-xl p-4 flex items-center gap-3" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
            <span className="text-2xl">{condition?.icon}</span>
            <div>
              <div className="font-mono text-xs text-slate-500 uppercase">Condition</div>
              <div className="font-mono text-sm font-bold text-cyan-300">{condition?.label}</div>
              <div className="font-mono text-xs text-slate-500">{condition?.value}</div>
            </div>
            <button onClick={() => setStep(1)} className="ml-auto font-mono text-xs text-slate-500 hover:text-cyan-300 transition-colors">
              Change
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => { setInputMode('scan'); setTokenPayload(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-xs transition-all
                ${inputMode === 'scan' ? 'btn-solid text-white' : 'btn-neon'}`}>
              <FiGrid size={13} /> Scan QR
            </button>
            <button onClick={() => { setInputMode('manual'); setTokenPayload(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-xs transition-all
                ${inputMode === 'manual' ? 'btn-solid text-white' : 'btn-neon'}`}>
              <FiHash size={13} /> Manual ID
            </button>
          </div>

          {inputMode === 'scan' ? (
            <div className="text-center space-y-4">
              {/* Captured token display */}
              {tokenPayload ? (
                <div className="glass rounded-xl p-4 text-left" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-500 uppercase">
                      {tokenPayload.type === 'manual_id' ? 'Manual ID captured' : 'Secure token captured'}
                    </span>
                    <button onClick={() => setTokenPayload(null)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <FiX size={14} />
                    </button>
                  </div>
                  <code className="font-mono text-sm text-cyan-300 break-all">
                    {tokenPayload.type === 'manual_id'
                      ? tokenPayload.value
                      : `${tokenPayload.value.slice(0, 40)}…`}
                  </code>
                  <div className="mt-2">
                    <span className={`font-mono text-xs px-2 py-0.5 rounded ${tokenPayload.type === 'manual_id' ? 'bg-purple-400/10 text-purple-300' : 'bg-cyan-400/10 text-cyan-300'}`}>
                      {tokenPayload.type === 'manual_id' ? '6-digit Manual ID' : 'Secure Token (from QR)'}
                    </span>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowScanner(true)}
                  className="w-full py-16 glass rounded-2xl border-dashed border flex flex-col items-center gap-3 hover:border-cyan-400/40 transition-all group"
                  style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all">
                    <FiGrid size={32} className="text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-mono text-sm text-slate-300">Tap to open camera</div>
                    <div className="font-mono text-xs text-slate-600 mt-1">Scan holder's QR code</div>
                  </div>
                </button>
              )}
            </div>
          ) : (
            /* Manual ID entry */
            <div className="space-y-3">
              <label className="font-mono text-xs text-slate-500 uppercase tracking-widest block">
                Manual ID (6 chars) or full Secure Token
              </label>
              <input
                type="text"
                value={manualInput}
                onChange={e => { setManualInput(e.target.value); setTokenPayload(null); }}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                placeholder="e.g. A1B2C3"
                maxLength={512}
                className="input-cyber w-full px-4 py-3 rounded-xl font-mono text-lg tracking-[0.3em] text-center uppercase"
                autoFocus
              />
              {manualInput.length > 0 && !tokenPayload && (
                <button onClick={handleManualSubmit} className="btn-neon w-full py-2.5 rounded-xl font-mono text-sm">
                  Use This Token
                </button>
              )}
              {tokenPayload && (
                <div className="glass rounded-xl p-3 flex items-center justify-between"
                  style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
                  <div>
                    <span className="font-mono text-xs text-slate-500">
                      {tokenPayload.type === 'manual_id' ? 'Manual ID' : 'Secure Token'} ready
                    </span>
                    <code className="block font-mono text-sm text-cyan-300">{tokenPayload.value}</code>
                  </div>
                  <button onClick={() => { setTokenPayload(null); setManualInput(''); }} className="text-slate-500 hover:text-red-400">
                    <FiX size={14} />
                  </button>
                </div>
              )}
              <p className="font-mono text-xs text-slate-600">
                Enter the 6-char Manual ID from holder's QR modal, or paste the full secure token
              </p>
            </div>
          )}

          <button
            onClick={verify}
            disabled={loading || !tokenPayload}
            className="btn-solid w-full py-4 rounded-xl font-display font-bold tracking-widest text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading
              ? <><Spinner size={16} /> Verifying on-chain…</>
              : <><FiSearch size={16} /> Verify Now</>}
          </button>
        </div>
      )}

      {/* ── Step 3: Result ── */}
      {step === 3 && result && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultIndicator value={result.blockchain_trusted} label="Blockchain Trusted" />
            <ResultIndicator value={conditionResult} label="Condition Met" />
            <ResultIndicator value={result.overall_result} label="Overall Result" />
          </div>

          {/* Per-condition breakdown */}
          {result.results?.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-3">Condition Results</div>
              {result.results.map((r, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0"
                  style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
                  <span className="font-mono text-xs text-slate-400">{r.condition}</span>
                  <span className={`font-mono text-xs font-bold ${r.result ? 'text-green-400' : 'text-red-400'}`}>
                    {r.result ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-3">Verification Details</div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
              <span className="font-mono text-xs text-slate-500">Condition</span>
              <span className="font-mono text-xs text-cyan-300">{condition?.label} — <code>{condition?.value}</code></span>
            </div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
              <span className="font-mono text-xs text-slate-500">Manual ID</span>
              <span className="font-mono text-xs text-slate-300">{result.manual_id || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
              <span className="font-mono text-xs text-slate-500">Credential ID</span>
              <span className="font-mono text-xs text-slate-300">{result.credential_id?.substring(0, 16)}…</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
              <span className="font-mono text-xs text-slate-500">Timestamp</span>
              <span className="font-mono text-xs text-slate-300">
                {result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-mono text-xs text-slate-500">Protocol</span>
              <span className="font-mono text-xs text-purple-400">Homomorphic Encryption</span>
            </div>
          </div>

          <button onClick={reset}
            className="btn-neon w-full py-3.5 rounded-xl font-mono text-sm flex items-center justify-center gap-2">
            <FiRefreshCw size={14} /> New Verification
          </button>
        </div>
      )}

      {showScanner && (
        <ScannerModal onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}

function VerifierHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/verifier/logs')
      .then(r => setHistory(r.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const resultBadge = (v) => {
    if (v === true || v === 'true') return 'badge-success';
    if (v === false || v === 'false') return 'badge-danger';
    return 'badge-info';
  };

  return (
    <>
      <SectionHeader title="Verification History" subtitle="All verification requests this session" />
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : history.length === 0 ? (
        <EmptyState icon="📊" title="No verifications yet" message="Run your first verification to see results here." />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
                  {['Credential ID', 'Holder ID', 'Condition', 'Result', 'Time'].map(h => (
                    <th key={h} className="text-left py-3 px-5 font-mono text-xs text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'rgba(0,212,255,0.05)' }}>
                    <td className="py-4 px-5 font-mono text-xs text-slate-400">{h.credential_id?.substring(0, 8)}…</td>
                    <td className="py-4 px-5 font-mono text-xs text-slate-400">{h.holder_id?.substring(0, 8)}…</td>
                    <td className="py-4 px-5 font-mono text-xs text-cyan-300">{h.condition || '—'}</td>
                    <td className="py-4 px-5">
                      <span className={`${resultBadge(h.result)} inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold`}>
                        {h.result === true ? 'PASS' : h.result === false ? 'FAIL' : String(h.result).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-slate-600">
                      {h.timestamp ? new Date(h.timestamp).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default function VerifierDashboard() {
  return (
    <Routes>
      <Route index element={<VerifyFlow />} />
      <Route path="history" element={<VerifierHistory />} />
    </Routes>
  );
}
