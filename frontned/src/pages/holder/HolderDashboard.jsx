import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, useMatch } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Spinner, EmptyState, Badge, SectionHeader } from '../../components/ui/index';
import QRModal from '../../components/ui/QRModal';
import { FiShare2, FiCamera, FiSettings, FiSave, FiX, FiEye, FiChevronRight, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

// Allowed fields for sharing
const ALLOWED_SHARE_FIELDS = [
  "full_name", "gender", "state",
  "age", "education_level",
  "marital_status", "citizenship_status"
];

const FIELD_LABELS = {
  full_name: "Full Name",
  gender: "Gender",
  state: "State",
  age: "Age",
  education_level: "Education Level",
  marital_status: "Marital Status",
  citizenship_status: "Citizenship Status"
};

// Navigation Tabs Component
function DashboardTabs() {
  const navigate = useNavigate();
  const logsMatch = useMatch('/dashboard/holder/logs');
  const isLogsTab = !!logsMatch;

  const tabs = [
    { id: 'credentials', label: 'Credentials', icon: '🪪' },
    { id: 'logs', label: 'Verification Logs', icon: '📜' }
  ];

  return (
    <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => navigate(tab.id === 'credentials' ? '/dashboard/holder' : `/dashboard/holder/${tab.id}`)}
          className={`px-6 py-3 font-mono text-sm transition-all flex items-center gap-2 ${
            (tab.id === 'logs' && isLogsTab) || (tab.id === 'credentials' && !isLogsTab)
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function CredentialDetailModal({ credential, onClose }) {
  const [activeTab, setActiveTab] = useState('basic');

  if (!credential) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 glass rounded-t-2xl p-6 border-b" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-2xl">
                {credential.credential_type === 'identity' ? '🪪' : '📄'}
              </div>
              <div>
                <div className="font-mono text-lg font-semibold text-slate-200">
                  {credential.credential_type?.toUpperCase() || 'Identity Proof'}
                </div>
                <div className="font-mono text-xs text-slate-500">
                  ID: {credential.credential_id}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 text-sm font-mono transition-colors ${
                activeTab === 'basic' 
                  ? 'text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('attributes')}
              className={`px-4 py-2 text-sm font-mono transition-colors ${
                activeTab === 'attributes' 
                  ? 'text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Attributes
            </button>
            <button
              onClick={() => setActiveTab('masked')}
              className={`px-4 py-2 text-sm font-mono transition-colors ${
                activeTab === 'masked' 
                  ? 'text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Masked IDs
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {credential.basic && Object.keys(credential.basic).length > 0 ? (
                Object.entries(credential.basic).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
                    <span className="font-mono text-sm text-slate-400">
                      {FIELD_LABELS[key] || key.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="font-mono text-sm text-slate-200 font-semibold">
                      {value || '—'}
                    </span>
                  </div>
                ))
              ) : (
                // Fallback: show top-level credential fields if basic is missing
                Object.entries(credential)
                  .filter(([key]) => !['credential_id', 'credential_type', 'attributes', 'basic', 'masked_identifiers', 'revoked', 'expires_at', 'secure_token', 'manual_id'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between py-3 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
                      <span className="font-mono text-sm text-slate-400">
                        {FIELD_LABELS[key] || key.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="font-mono text-sm text-slate-200 font-semibold">
                        {String(value) || '—'}
                      </span>
                    </div>
                  ))
              )}
              {(!credential.basic || Object.keys(credential.basic).length === 0) &&
               Object.keys(credential).filter(k => !['credential_id', 'credential_type', 'attributes', 'basic', 'masked_identifiers', 'revoked', 'expires_at', 'secure_token', 'manual_id'].includes(k)).length === 0 && (
                <p className="text-sm font-mono text-slate-500 text-center py-4">No basic info available</p>
              )}
            </div>
          )}

          {activeTab === 'attributes' && (
            <div className="space-y-4">
              {credential.attributes && Object.keys(credential.attributes).length > 0 ? (
                Object.entries(credential.attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
                    <span className="font-mono text-sm text-slate-400">
                      {FIELD_LABELS[key] || key.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="font-mono text-sm text-slate-200 font-semibold">
                      {typeof value === 'boolean' ? (value ? '✓ Yes' : '✗ No') : (value || '—')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm font-mono text-slate-500 text-center py-4">No attributes available</p>
              )}
            </div>
          )}

          {activeTab === 'masked' && (
            <div className="space-y-4">
              {credential.masked_identifiers && Object.keys(credential.masked_identifiers).length > 0 ? (
                Object.entries(credential.masked_identifiers).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b" style={{ borderColor: 'rgba(0,212,255,0.07)' }}>
                    <span className="font-mono text-sm text-slate-400">
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="font-mono text-sm text-green-400">
                      ✓ {value}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm font-mono text-slate-500 text-center py-4">No masked identifiers available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareLinkModal({ credential, defaultFields, onClose, onCreateShareLink }) {
  const [selectedFields, setSelectedFields] = useState({});
  const [condition, setCondition] = useState('');
  const [useDefaults, setUseDefaults] = useState(true);

  const availableFields = ALLOWED_SHARE_FIELDS.filter(field => 
    (credential.basic && credential.basic[field]) || 
    (credential.attributes && credential.attributes[field])
  );

  const handleSubmit = () => {
    let fieldsToShare;
    if (useDefaults) {
      fieldsToShare = defaultFields.filter(f => availableFields.includes(f));
      if (fieldsToShare.length === 0) {
        toast.error('No default fields available for this credential');
        return;
      }
    } else {
      fieldsToShare = Object.keys(selectedFields).filter(k => selectedFields[k]);
      if (fieldsToShare.length === 0) {
        toast.error('Please select at least one field to share');
        return;
      }
    }
    
    onCreateShareLink(credential.credential_id, fieldsToShare, condition);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-mono font-semibold">Create Share Link</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <FiX size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 p-2 bg-slate-800/50 rounded-lg">
              <button
                onClick={() => setUseDefaults(true)}
                className={`flex-1 py-2 text-sm font-mono rounded-lg transition-colors ${
                  useDefaults ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'
                }`}
              >
                Use Defaults
              </button>
              <button
                onClick={() => setUseDefaults(false)}
                className={`flex-1 py-2 text-sm font-mono rounded-lg transition-colors ${
                  !useDefaults ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'
                }`}
              >
                Custom Selection
              </button>
            </div>

            {useDefaults ? (
              <div className="p-3 bg-cyan-500/10 rounded-lg">
                <div className="text-xs font-mono text-cyan-400 mb-2">Default Fields:</div>
                <div className="text-xs font-mono text-slate-300">
                  {defaultFields.filter(f => availableFields.includes(f)).map(f => FIELD_LABELS[f]).join(', ') || 'No default fields available'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 mb-2">Select fields to share:</div>
                {availableFields.map((field) => (
                  <label key={field} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={selectedFields[field] || false}
                      onChange={(e) => setSelectedFields(prev => ({ ...prev, [field]: e.target.checked }))}
                      className="rounded border-cyan-500"
                    />
                    <span className="font-mono text-sm text-slate-300">{FIELD_LABELS[field]}</span>
                  </label>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="Condition (e.g., age >= 18)"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-800 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
            />

            <button
              onClick={handleSubmit}
              className="btn-neon w-full py-2 rounded-xl font-mono text-sm"
            >
              Generate & Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HolderCredentials() {
  const [creds, setCreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [qrCred, setQrCred] = useState(null);
  const [sharingCred, setSharingCred] = useState(null);
  const [generatingQR, setGeneratingQR] = useState({});
  const [showDefaultFieldsModal, setShowDefaultFieldsModal] = useState(false);
  const [defaultFields, setDefaultFields] = useState([]);
  const [tempDefaultFields, setTempDefaultFields] = useState([]);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  useEffect(() => {
    loadCredentials();
    loadDefaultFields();
  }, []);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const response = await api.get('/holder/credentials');
      console.log('Loaded credentials:', response.data);
      setCreds(response.data);
    } catch (err) {
      console.error('Failed to load credentials:', err);
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultFields = async () => {
    setLoadingDefaults(true);
    try {
      const response = await api.get('/holder/default-fields');
      let fields = response.data.fields || [];
      fields = fields.filter(f => ALLOWED_SHARE_FIELDS.includes(f));
      setDefaultFields(fields);
      setTempDefaultFields(fields);
    } catch (err) {
      console.error('Failed to load default fields:', err);
      setDefaultFields([]);
      setTempDefaultFields([]);
    } finally {
      setLoadingDefaults(false);
    }
  };

  const updateDefaultFields = async () => {
    const validFields = tempDefaultFields.filter(f => ALLOWED_SHARE_FIELDS.includes(f));
    
    if (validFields.length !== tempDefaultFields.length) {
      const invalid = tempDefaultFields.filter(f => !ALLOWED_SHARE_FIELDS.includes(f));
      toast.error(`Invalid fields: ${invalid.join(', ')}. Only allowed fields are: ${ALLOWED_SHARE_FIELDS.join(', ')}`);
      return;
    }

    try {
      await api.put('/holder/default-fields', { fields: validFields });
      setDefaultFields(validFields);
      setShowDefaultFieldsModal(false);
      toast.success('Default share fields updated successfully!');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.detail || 'Failed to update default fields');
    }
  };

  // Fetch full credential detail (with basic, attributes, masked_identifiers)
  // The list endpoint only returns summary fields — detail comes from /credentials/{id}
  const handleSelectCredential = async (cred) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/holder/credentials/${cred.credential_id}`);
      setSelectedCredential(response.data);
    } catch (err) {
      console.error('Failed to load credential detail:', err);
      toast.error('Failed to load credential details');
      // Fallback: open with what we have (modal will show empty-state messages)
      setSelectedCredential(cred);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGenerateQR = async (credential) => {
    setGeneratingQR(prev => ({ ...prev, [credential.credential_id]: true }));
    try {
      const refreshRes = await api.post(`/holder/credentials/${credential.credential_id}/refresh`);
      const { secure_token, expires_at, manual_id } = refreshRes.data;
      
      if (!secure_token) {
        toast.error('No secure token received');
        return;
      }
      
      const qrCredential = {
        ...credential,
        secure_token: secure_token,
        manual_id: manual_id || `MANUAL-${credential.credential_id.substring(0, 8)}`,
        expires_at: expires_at
      };
      
      setQrCred(qrCredential);
      toast.success('QR code generated successfully!');
    } catch (err) {
      console.error('QR generation error:', err);
      toast.error(err.response?.data?.detail || 'Failed to generate QR code');
    } finally {
      setGeneratingQR(prev => ({ ...prev, [credential.credential_id]: false }));
    }
  };

  const handleCreateShareLink = async (credentialId, fields, condition) => {
    try {
      const response = await api.post(`/holder/credentials/${credentialId}/share-link`, {
        fields: fields,
        conditions: condition || null,
      });
      
      const fullLink = `${window.location.origin}${response.data.verification_link}`;
      await navigator.clipboard.writeText(fullLink);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      console.error('Share link error:', err);
      toast.error(err.response?.data?.detail || 'Failed to create share link');
    }
  };

  const getCredentialSummary = (cred) => {
    const summary = [];
    if (cred.basic?.full_name) summary.push(cred.basic.full_name);
    if (cred.basic?.state) summary.push(`📍 ${cred.basic.state}`);
    if (cred.attributes?.age) summary.push(`🎂 ${cred.attributes.age} yrs`);
    if (cred.attributes?.citizenship_status) summary.push(`🛂 ${cred.attributes.citizenship_status}`);
    if (cred.attributes?.education_level) summary.push(`🎓 ${cred.attributes.education_level}`);
    return summary;
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={36} /></div>;

  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <SectionHeader
          title="My Credentials"
          subtitle="Encrypted identity proofs stored on-chain"
        />
        <button
          onClick={() => setShowDefaultFieldsModal(true)}
          className="btn-neon py-2 px-4 rounded-xl font-mono text-sm flex items-center gap-2"
        >
          <FiSettings size={16} /> Default Fields
        </button>
      </div>

      {creds.length === 0 ? (
        <EmptyState icon="🪪" title="No credentials" message="Wait for an issuer to provision your identity." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {creds.map((cred) => (
            <div key={cred.credential_id} className="glass glass-hover rounded-2xl p-6 flex flex-col gap-4">
              {/* Header - Clickable for details */}
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => handleSelectCredential(cred)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-xl">
                    {cred.credential_type === 'identity' ? '🪪' : '📄'}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-semibold text-slate-200">
                      {cred.credential_type?.toUpperCase() || 'Identity Proof'}
                    </div>
                    <div className="font-mono text-xs text-slate-500">
                      ID: {cred.credential_id}
                    </div>
                  </div>
                </div>
                <Badge variant={cred.revoked ? 'danger' : 'success'}>
                  {cred.revoked ? 'Revoked' : 'Active'}
                </Badge>
              </div>

              {/* Summary - Clickable for details */}
              <div 
                className="flex flex-col gap-1 cursor-pointer"
                onClick={() => handleSelectCredential(cred)}
              >
                {getCredentialSummary(cred).map((item, idx) => (
                  <div key={idx} className="text-xs font-mono text-slate-300">
                    {item}
                  </div>
                ))}
              </div>

              {/* Footer with expiry and view indicator */}
              <div 
                className="flex items-center justify-between pt-2 border-t cursor-pointer"
                style={{ borderColor: 'rgba(0,212,255,0.07)' }}
                onClick={() => handleSelectCredential(cred)}
              >
                <div className="text-xs font-mono text-slate-500">
                  {cred.expires_at && `Expires: ${new Date(cred.expires_at).toLocaleDateString()}`}
                </div>
                {loadingDetail ? (
                  <span className="font-mono text-xs text-cyan-400 animate-pulse">Loading...</span>
                ) : (
                  <FiEye className="text-cyan-400" size={16} />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleGenerateQR(cred)}
                  disabled={generatingQR[cred.credential_id]}
                  className="btn-neon flex-1 py-2 rounded-xl font-mono text-sm flex items-center justify-center gap-2"
                >
                  <FiCamera size={14} /> {generatingQR[cred.credential_id] ? '...' : 'QR'}
                </button>
                <button
                  onClick={() => setSharingCred(cred)}
                  className="btn-neon flex-1 py-2 rounded-xl font-mono text-sm flex items-center justify-center gap-2"
                >
                  <FiShare2 size={14} /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Credential Detail Modal */}
      {selectedCredential && (
        <CredentialDetailModal
          credential={selectedCredential}
          onClose={() => setSelectedCredential(null)}
        />
      )}

      {/* Share Link Modal */}
      {sharingCred && (
        <ShareLinkModal
          credential={sharingCred}
          defaultFields={defaultFields}
          onClose={() => setSharingCred(null)}
          onCreateShareLink={handleCreateShareLink}
        />
      )}

      {/* Default Fields Modal */}
      {showDefaultFieldsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDefaultFieldsModal(false)}>
          <div className="glass rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-mono font-semibold">Default Share Fields</h3>
                <button
                  onClick={() => {
                    setShowDefaultFieldsModal(false);
                    setTempDefaultFields(defaultFields);
                  }}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <p className="text-xs font-mono text-slate-400 mb-4">
                Select which fields should be shared by default. These will be used when creating share links unless you specify custom fields.
              </p>

              {loadingDefaults ? (
                <div className="flex justify-center py-8">
                  <Spinner size={24} />
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {ALLOWED_SHARE_FIELDS.map((field) => (
                      <label key={field} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={tempDefaultFields.includes(field)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempDefaultFields([...tempDefaultFields, field]);
                            } else {
                              setTempDefaultFields(tempDefaultFields.filter(f => f !== field));
                            }
                          }}
                          className="w-4 h-4 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="font-mono text-sm text-slate-300">
                          {FIELD_LABELS[field]}
                        </span>
                      </label>
                    ))}
                  </div>

                  {tempDefaultFields.length > 0 && (
                    <div className="mb-4 p-3 bg-cyan-500/10 rounded-lg">
                      <div className="text-xs font-mono text-cyan-400 mb-1">Selected defaults:</div>
                      <div className="text-xs font-mono text-slate-300">
                        {tempDefaultFields.map(f => FIELD_LABELS[f]).join(', ')}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={updateDefaultFields}
                      className="btn-neon flex-1 py-2 rounded-xl font-mono text-sm flex items-center justify-center gap-2"
                    >
                      <FiSave size={14} /> Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setShowDefaultFieldsModal(false);
                        setTempDefaultFields(defaultFields);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-700 text-sm font-mono"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
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

function HolderLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/holder/logs');
      setLogs(response.data);
    } catch (err) {
      console.error('Failed to load logs:', err);
      toast.error('Failed to load verification history');
    } finally {
      setLoading(false);
    }
  };

  const isPass = (result) =>
    result === true || result === 'true' || result === 'pass' || result === 'PASS';

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'pass') return isPass(log.result);
    if (filter === 'fail') return !isPass(log.result);
    return true;
  });

  const stats = {
    total: logs.length,
    passed: logs.filter(l => isPass(l.result)).length,
    failed: logs.filter(l => !isPass(l.result)).length,
    rate: logs.length > 0 ? Math.round((logs.filter(l => isPass(l.result)).length / logs.length) * 100) : 0,
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Group logs by date for timeline
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 rounded-full bg-cyan-400" />
          <h2 className="font-mono text-xl font-bold text-slate-100 tracking-tight">Verification History</h2>
        </div>
        <p className="font-mono text-xs text-slate-500 ml-4">Complete audit trail of all identity verification events</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {/* Total */}
        <div className="glass rounded-2xl p-4 border" style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Total</span>
            <div className="w-6 h-6 rounded-lg bg-slate-700/60 flex items-center justify-center">
              <FiClock size={11} className="text-slate-400" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-slate-100">{stats.total}</div>
          <div className="font-mono text-[10px] text-slate-600 mt-1">verifications</div>
        </div>

        {/* Passed */}
        <div className="glass rounded-2xl p-4 border" style={{ borderColor: 'rgba(34,197,94,0.1)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Passed</span>
            <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FiCheckCircle size={11} className="text-green-400" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-green-400">{stats.passed}</div>
          <div className="font-mono text-[10px] text-slate-600 mt-1">successful</div>
        </div>

        {/* Failed */}
        <div className="glass rounded-2xl p-4 border" style={{ borderColor: 'rgba(239,68,68,0.1)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Failed</span>
            <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FiXCircle size={11} className="text-red-400" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-red-400">{stats.failed}</div>
          <div className="font-mono text-[10px] text-slate-600 mt-1">rejected</div>
        </div>

        {/* Success Rate */}
        <div className="glass rounded-2xl p-4 border" style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Rate</span>
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <FiChevronRight size={11} className="text-cyan-400" />
            </div>
          </div>
          <div className="font-mono text-3xl font-bold text-cyan-400">{stats.rate}%</div>
          {/* Mini progress bar */}
          <div className="mt-2 h-1 rounded-full bg-slate-700/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-700"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6">
        <span className="font-mono text-[10px] text-slate-600 uppercase tracking-widest mr-1">Filter</span>
        {[
          { id: 'all', label: `All  (${stats.total})`, active: 'bg-slate-700 text-slate-200 border-slate-600' },
          { id: 'pass', label: `✓  Passed  (${stats.passed})`, active: 'bg-green-500/15 text-green-400 border-green-500/40' },
          { id: 'fail', label: `✗  Failed  (${stats.failed})`, active: 'bg-red-500/15 text-red-400 border-red-500/40' },
        ].map(({ id, label, active }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-all ${
              filter === id ? active : 'border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner size={32} />
          <span className="font-mono text-xs text-slate-600 animate-pulse">Fetching verification logs...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-3xl mb-2">📜</div>
          <div className="font-mono text-sm font-semibold text-slate-400">
            {logs.length === 0 ? 'No verifications yet' : 'No matching logs'}
          </div>
          <div className="font-mono text-xs text-slate-600 text-center max-w-xs">
            {logs.length === 0
              ? "Your identity credentials haven't been verified by anyone yet."
              : 'Try changing the filter to see more results.'}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-3">
                <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest whitespace-nowrap">{date}</div>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(0,212,255,0.12), transparent)' }} />
                <div className="font-mono text-[10px] text-slate-600">{dateLogs.length} event{dateLogs.length !== 1 ? 's' : ''}</div>
              </div>

              {/* Log entries for this date */}
              <div className="space-y-2">
                {dateLogs.map((log, index) => {
                  const pass = isPass(log.result);
                  const { time } = formatTime(log.timestamp);
                  return (
                    <div
                      key={index}
                      className="group relative glass rounded-xl overflow-hidden transition-all hover:bg-white/[0.025]"
                      style={{ borderLeft: `2px solid ${pass ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}` }}
                    >
                      {/* Subtle glow line on hover */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl`}
                        style={{ background: pass ? 'radial-gradient(ellipse at left, rgba(34,197,94,0.04) 0%, transparent 60%)' : 'radial-gradient(ellipse at left, rgba(239,68,68,0.04) 0%, transparent 60%)' }}
                      />

                      <div className="relative flex items-center gap-4 px-4 py-3.5">
                        {/* Status icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${pass ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          {pass
                            ? <FiCheckCircle size={15} className="text-green-400" />
                            : <FiXCircle size={15} className="text-red-400" />
                          }
                        </div>

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-xs font-semibold text-slate-200 truncate">
                              {log.credential_id}
                            </span>
                            {log.condition && (
                              <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 font-mono text-[10px] text-cyan-400 truncate max-w-[180px]">
                                if {log.condition}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-600">verified by</span>
                            <span className="font-mono text-[10px] text-slate-400">{log.verified_by}</span>
                          </div>
                        </div>

                        {/* Right side: badge + time */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-widest ${
                            pass
                              ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}>
                            {pass ? 'PASS' : 'FAIL'}
                          </span>
                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600">
                            <FiClock size={9} />
                            <span>{time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function HolderDashboard() {
  return (
    <div>
      <DashboardTabs />
      <Routes>
        <Route index element={<HolderCredentials />} />
        <Route path="credentials" element={<HolderCredentials />} />
        <Route path="logs" element={<HolderLogs />} />
        <Route path="*" element={<HolderCredentials />} />
      </Routes>
    </div>
  );
}