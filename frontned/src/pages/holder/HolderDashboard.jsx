import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Spinner, EmptyState, Badge, SectionHeader } from '../../components/ui/index';
import QRModal from '../../components/ui/QRModal';
import { FiShare2, FiCamera } from 'react-icons/fi';

function HolderCredentials() {
  const [creds, setCreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCred, setQrCred] = useState(null);
  const [sharingCredId, setSharingCredId] = useState(null);
  const [shareFields, setShareFields] = useState({});
  const [condition, setCondition] = useState('');
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await api.get('/holder/credentials');
      // Fetch full details for each credential
      const credDetails = await Promise.all(
        response.data.map(async (cred) => {
          const detailRes = await api.get(`/holder/credentials/${cred.credential_id}`);
          return detailRes.data;
        })
      );
      setCreds(credDetails);
    } catch (err) {
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (credential) => {
    setGeneratingQR(true);
    try {
      console.log('Generating QR for credential:', credential.credential_id);
      
      // First refresh the token to get a fresh secure_token
      const refreshRes = await api.post(`/holder/credentials/${credential.credential_id}/refresh`);
      console.log('Refresh response:', refreshRes.data);
      
      const { secure_token, expires_at, manual_id } = refreshRes.data;
      
      if (!secure_token) {
        toast.error('No secure token received');
        return;
      }
      
      // Create a credential object with both tokens for QRModal
      const qrCredential = {
        ...credential,
        secure_token: secure_token,
        manual_id: manual_id || `MANUAL-${credential.credential_id.substring(0, 8)}`,
        expires_at: expires_at
      };
      
      console.log('Setting QR credential:', qrCredential);
      
      setQrCred(qrCredential);
      toast.success('QR code generated successfully!');
    } catch (err) {
      console.error('QR generation error:', err);
      toast.error(err.response?.data?.detail || 'Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleCreateShareLink = async (credentialId) => {
    const selected = shareFields[credentialId] || {};
    const selectedFields = Object.keys(selected).filter(k => selected[k]);
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to share');
      return;
    }

    try {
      const response = await api.post(`/holder/credentials/${credentialId}/share-link`, {
        fields: selectedFields,          // array of strings, matches ShareLinkRequest.fields
        conditions: condition || null,   // matches ShareLinkRequest.conditions (the schema field name)
      });
      
      // Copy link to clipboard
      const fullLink = `${window.location.origin}${response.data.verification_link}`;
      await navigator.clipboard.writeText(fullLink);
      toast.success('Share link copied to clipboard!');
      
      // Reset
      setSharingCredId(null);
      setShareFields({});
      setCondition('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create share link');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={36} /></div>;

  return (
    <>
      <SectionHeader
        title="My Credentials"
        subtitle="Encrypted identity proofs stored on-chain"
      />

      {creds.length === 0 ? (
        <EmptyState icon="🪪" title="No credentials" message="Wait for an issuer to provision your identity." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {creds.map((cred) => (
            <div key={cred.credential_id} className="glass glass-hover rounded-2xl p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-xl">
                    {cred.credential_type === 'identity' ? '🪪' : '📄'}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-semibold text-slate-200">
                      {cred.credential_type?.toUpperCase() || 'Identity Proof'}
                    </div>
                    <div className="font-mono text-xs text-slate-600">
                      ID: {cred.credential_id?.substring(0, 8)}...
                    </div>
                  </div>
                </div>
                <Badge variant={cred.revoked ? 'danger' : 'success'}>
                  {cred.revoked ? 'Revoked' : 'Active'}
                </Badge>
              </div>

              {/* Masked Identifiers */}
              {cred.masked_identifiers && Object.keys(cred.masked_identifiers).length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-mono text-slate-500 mb-1">Verified Attributes</div>
                  {Object.entries(cred.masked_identifiers).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b"
                      style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
                      <span className="font-mono text-xs text-slate-400">
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="font-mono text-xs text-green-400">
                        ✓ {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Issuer Info */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600">Issuer: {cred.issuer_id || 'Trusted Authority'}</span>
                {cred.expires_at && (
                  <span className="text-slate-600">
                    Expires: {new Date(cred.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Share Link Section */}
              {sharingCredId === cred.credential_id ? (
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-400">Select fields to share:</div>
                  {cred.masked_identifiers && Object.keys(cred.masked_identifiers).map((field) => (
                    <label key={field} className="flex items-center gap-2 text-xs font-mono">
                      <input
                        type="checkbox"
                        checked={shareFields[cred.credential_id]?.[field] || false}
                        onChange={(e) => {
                          setShareFields(prev => ({
                            ...prev,
                            [cred.credential_id]: {
                              ...(prev[cred.credential_id] || {}),
                              [field]: e.target.checked
                            }
                          }));
                        }}
                        className="rounded border-cyan-500"
                      />
                      {field.replace(/_/g, ' ').toUpperCase()}
                    </label>
                  ))}
                  <input
                    type="text"
                    placeholder="Condition (e.g., age >= 18)"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-800 rounded border border-slate-700"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCreateShareLink(cred.credential_id)}
                      className="btn-neon flex-1 py-2 rounded-xl font-mono text-sm"
                    >
                      Generate Link
                    </button>
                    <button
                      onClick={() => {
                        setSharingCredId(null);
                        setShareFields({});
                        setCondition('');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateQR(cred)}
                    disabled={generatingQR}
                    className="btn-neon flex-1 py-3 rounded-xl font-mono text-sm flex items-center justify-center gap-2"
                  >
                    <FiCamera size={16} /> {generatingQR ? 'Generating...' : 'Show QR Code'}
                  </button>
                  <button
                    onClick={() => setSharingCredId(cred.credential_id)}
                    className="btn-neon py-3 px-4 rounded-xl font-mono text-sm flex items-center justify-center gap-2"
                  >
                    <FiShare2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrCred && (
        <QRModal 
          credential={qrCred}
          onClose={() => setQrCred(null)} 
        />
      )}
    </>
  );
}

function HolderHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/holder/logs')
      .then(r => setHistory(r.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const resultColor = (v) => {
    if (v === true || v === 'true' || v === 'pass' || v === 'PASS') return 'text-green-400';
    if (v === false || v === 'false' || v === 'fail' || v === 'FAIL') return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <>
      <SectionHeader title="Verification History" subtitle="Queries against your identity" />
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : history.length === 0 ? (
        <EmptyState icon="📜" title="No history" message="Your identity hasn't been queried yet." />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
                  {['Credential ID', 'Verified By', 'Condition', 'Result', 'Timestamp'].map(h => (
                    <th key={h} className="text-left py-3 px-5 font-mono text-xs text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'rgba(0,212,255,0.05)' }}>
                    <td className="py-4 px-5 font-mono text-xs text-slate-400">{h.credential_id?.substring(0, 8)}...</td>
                    <td className="py-4 px-5 font-mono text-xs text-slate-300">{h.verified_by || '—'}</td>
                    <td className="py-4 px-5 font-mono text-xs text-cyan-300">{h.condition || '—'}</td>
                    <td className="py-4 px-5">
                      <span className={`font-mono text-xs font-bold ${resultColor(h.result)}`}>
                        {typeof h.result === 'boolean' ? (h.result ? 'PASS' : 'FAIL') : String(h.result).toUpperCase()}
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

export default function HolderDashboard() {
  return (
    <Routes>
      <Route index element={<HolderCredentials />} />
      <Route path="history" element={<HolderHistory />} />
    </Routes>
  );
}