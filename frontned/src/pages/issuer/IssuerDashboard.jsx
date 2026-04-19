import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Spinner, EmptyState, Badge, SectionHeader } from '../../components/ui/index';
import { 
  FiSend, FiUser, FiFileText, FiCheck, 
  FiList, FiPlus, FiRefreshCw, FiX, FiUsers, FiClock,
  FiSearch, FiChevronDown, FiActivity
} from 'react-icons/fi';

// Issue Credential Form Component
function IssueForm() {
  const [form, setForm] = useState({
    holder_id: '',
    credential_type: 'identity',
    basic: {
      full_name: '',
      gender: '',
      state: ''
    },
    attributes: {
      age: 0,
      citizenship_status: '',
      education_level: '',
      marital_status: '',
      license_validity: false,
      tax_compliance: false
    },
    identifiers: {
      aadhaar_number: '',
      pan_number: '',
      voter_id: '',
      driving_license: '',
      passport_number: '',
      ration_card_number: ''
    }
  });

  const [holders, setHolders] = useState([]);
  const [loadingHolders, setLoadingHolders] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch holders on component mount
  useEffect(() => {
    fetchHolders();
  }, []);

  const fetchHolders = async () => {
    setLoadingHolders(true);
    try {
      const response = await api.get('/issuer/holders');
      setHolders(response.data);
    } catch (error) {
      toast.error('Failed to load holders');
      console.error('Error fetching holders:', error);
    } finally {
      setLoadingHolders(false);
    }
  };

  const updateBasic = (key, value) => {
    setForm(prev => ({ ...prev, basic: { ...prev.basic, [key]: value } }));
  };

  const updateAttribute = (key, value) => {
    setForm(prev => ({ ...prev, attributes: { ...prev.attributes, [key]: value } }));
  };

  const updateIdentifier = (key, value) => {
    setForm(prev => ({ ...prev, identifiers: { ...prev.identifiers, [key]: value } }));
  };

  const selectHolder = (holder) => {
    setForm(prev => ({ ...prev, holder_id: holder.public_id }));
    setSearchTerm(`${holder.name} (${holder.email})`);
    setShowDropdown(false);
  };

  const filteredHolders = holders.filter(holder => 
    holder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holder.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holder.public_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const submit = async (e) => {
    e.preventDefault();
    
    if (!form.holder_id) {
      toast.error('Please select a holder');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        holder_id: form.holder_id,
        credential_type: form.credential_type,
        basic: {
          full_name: form.basic.full_name,
          gender: form.basic.gender,
          state: form.basic.state
        },
        attributes: {
          age: form.attributes.age,
          citizenship_status: form.attributes.citizenship_status,
          education_level: form.attributes.education_level,
          marital_status: form.attributes.marital_status,
          license_validity: form.attributes.license_validity,
          tax_compliance: form.attributes.tax_compliance
        },
        identifiers: {
          aadhaar_number: form.identifiers.aadhaar_number || null,
          pan_number: form.identifiers.pan_number || null,
          voter_id: form.identifiers.voter_id || null,
          driving_license: form.identifiers.driving_license || null,
          passport_number: form.identifiers.passport_number || null,
          ration_card_number: form.identifiers.ration_card_number || null
        }
      };

      await api.post('/issuer/issue', payload);

      toast.success('Credential issued and anchored on-chain');
      setSuccess(true);

      // Reset form
      setForm({
        holder_id: '',
        credential_type: 'identity',
        basic: { full_name: '', gender: '', state: '' },
        attributes: {
          age: 0,
          citizenship_status: '',
          education_level: '',
          marital_status: '',
          license_validity: false,
          tax_compliance: false
        },
        identifiers: {
          aadhaar_number: '',
          pan_number: '',
          voter_id: '',
          driving_license: '',
          passport_number: '',
          ration_card_number: ''
        }
      });
      setSearchTerm('');
      setShowDropdown(false);

      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error('Issuance error:', e.response?.data);
      const errorMsg = e.response?.data?.detail || e.response?.data?.message || 'Issuance failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedHolder = holders.find(h => h.public_id === form.holder_id);

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeader title="Issue Credential" subtitle="Encrypt and anchor identity data to blockchain" />

      <form onSubmit={submit} className="glass rounded-2xl p-6 md:p-8 space-y-6">
        
        {/* Holder Selection with Search Dropdown */}
        <div className="space-y-1.5">
          <label className="font-mono text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <FiUsers size={11} /> Select Holder
          </label>
          
          <div className="relative">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) {
                    setForm(prev => ({ ...prev, holder_id: '' }));
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by name, email, or public ID..."
                className="input-cyber w-full pl-10 pr-10 py-3 rounded-xl font-mono text-sm"
                required
              />
              <FiChevronDown 
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform cursor-pointer ${showDropdown ? 'rotate-180' : ''}`}
                size={16}
                onClick={() => setShowDropdown(!showDropdown)}
              />
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-10 w-full mt-2 glass rounded-xl border border-white/10 max-h-64 overflow-y-auto" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 212, 255, 0.3) rgba(255, 255, 255, 0.05)'
              }}>
                {loadingHolders ? (
                  <div className="p-4 text-center">
                    <Spinner size={24} />
                  </div>
                ) : filteredHolders.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    No holders found
                  </div>
                ) : (
                  filteredHolders.map((holder) => (
                    <button
                      key={holder.public_id}
                      type="button"
                      onClick={() => selectHolder(holder)}
                      className="w-full p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="font-mono text-sm text-slate-200">{holder.name}</div>
                      <div className="font-mono text-xs text-slate-500">{holder.email}</div>
                      <div className="font-mono text-[10px] text-cyan-400 mt-1">{holder.public_id}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Holder Info */}
          {selectedHolder && (
            <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <FiCheck size={14} className="text-green-400" />
                <span className="text-xs text-green-400">
                  Selected: {selectedHolder.name} ({selectedHolder.public_id})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Credential Type */}
        <div className="space-y-1.5">
          <label className="font-mono text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <FiFileText size={11} /> Credential Type
          </label>
          <select
            value={form.credential_type}
            onChange={e => setForm(prev => ({ ...prev, credential_type: e.target.value }))}
            className="input-cyber w-full px-4 py-3 rounded-xl font-mono text-sm"
            required
          >
            <option value="identity">Identity Credential</option>
            <option value="financial">Financial Credential</option>
            <option value="education">Education Credential</option>
            <option value="professional">Professional Credential</option>
          </select>
        </div>

        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="font-mono text-sm font-semibold text-cyan-400 border-b border-cyan-400/20 pb-2">
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Full Name</label>
              <input
                value={form.basic.full_name}
                onChange={e => updateBasic('full_name', e.target.value)}
                placeholder="As per official document"
                required
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Gender</label>
              <select
                value={form.basic.gender}
                onChange={e => updateBasic('gender', e.target.value)}
                required
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">State</label>
              <input
                value={form.basic.state}
                onChange={e => updateBasic('state', e.target.value)}
                placeholder="State of residence"
                required
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Attributes Section */}
        <div className="space-y-4">
          <h3 className="font-mono text-sm font-semibold text-cyan-400 border-b border-cyan-400/20 pb-2">
            Attributes & Verifications
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Age</label>
              <input
                type="number"
                value={form.attributes.age}
                onChange={e => updateAttribute('age', parseInt(e.target.value) || 0)}
                placeholder="Age"
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Citizenship Status</label>
              <select
                value={form.attributes.citizenship_status}
                onChange={e => updateAttribute('citizenship_status', e.target.value)}
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              >
                <option value="">Select Status</option>
                <option value="citizen">Citizen</option>
                <option value="permanent resident">Permanent Resident</option>
                <option value="non-citizen">Non-Citizen</option>
                <option value="visa">Visa Holder</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Education Level</label>
              <select
                value={form.attributes.education_level}
                onChange={e => updateAttribute('education_level', e.target.value)}
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              >
                <option value="">Select Level</option>
                <option value="high school">High School</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="phd">PhD</option>
                <option value="diploma">Diploma</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Marital Status</label>
              <select
                value={form.attributes.marital_status}
                onChange={e => updateAttribute('marital_status', e.target.value)}
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              >
                <option value="">Select Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>

          {/* Boolean Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateAttribute('license_validity', !form.attributes.license_validity)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all
                ${form.attributes.license_validity
                  ? 'border-green-400/40 bg-green-400/10 text-green-400'
                  : 'border-slate-700/50 text-slate-500 hover:border-slate-600'}`}
            >
              <span className="font-mono text-sm">Driving License Valid</span>
              {form.attributes.license_validity ? <FiCheck size={16} /> : <FiX size={16} />}
            </button>

            <button
              type="button"
              onClick={() => updateAttribute('tax_compliance', !form.attributes.tax_compliance)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all
                ${form.attributes.tax_compliance
                  ? 'border-green-400/40 bg-green-400/10 text-green-400'
                  : 'border-slate-700/50 text-slate-500 hover:border-slate-600'}`}
            >
              <span className="font-mono text-sm">Tax Compliant</span>
              {form.attributes.tax_compliance ? <FiCheck size={16} /> : <FiX size={16} />}
            </button>
          </div>
        </div>

        {/* Identifiers Section */}
        <div className="space-y-4">
          <h3 className="font-mono text-sm font-semibold text-cyan-400 border-b border-cyan-400/20 pb-2">
            Government Identifiers (Optional)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Aadhaar Number</label>
              <input
                value={form.identifiers.aadhaar_number}
                onChange={e => updateIdentifier('aadhaar_number', e.target.value)}
                placeholder="12-digit Aadhaar number"
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">PAN Number</label>
              <input
                value={form.identifiers.pan_number}
                onChange={e => updateIdentifier('pan_number', e.target.value)}
                placeholder="10-digit PAN number"
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Voter ID</label>
              <input
                value={form.identifiers.voter_id}
                onChange={e => updateIdentifier('voter_id', e.target.value)}
                placeholder="Voter ID number"
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Driving License</label>
              <input
                value={form.identifiers.driving_license}
                onChange={e => updateIdentifier('driving_license', e.target.value)}
                placeholder="Driving license number"
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Passport Number</label>
              <input
                value={form.identifiers.passport_number}
                onChange={e => updateIdentifier('passport_number', e.target.value)}
                placeholder="Passport number"
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-slate-500">Ration Card Number</label>
              <input
                value={form.identifiers.ration_card_number}
                onChange={e => updateIdentifier('ration_card_number', e.target.value)}
                placeholder="Ration card number"
                className="input-cyber w-full px-4 py-2.5 rounded-xl font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-solid w-full py-4 rounded-xl font-display font-bold tracking-widest text-sm text-white flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <>
              <Spinner size={16} /> Encrypting & Anchoring...
            </>
          ) : success ? (
            <>
              <FiCheck size={16} /> Issued Successfully
            </>
          ) : (
            <>
              <FiSend size={16} /> Issue Credential
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Credential List Component
function CredentialList() {
  const [creds, setCreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchCredentials();
    fetchLogs();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await api.get('/issuer/credentials');
      setCreds(res.data);
    } catch (error) {
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/issuer/logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load logs');
    }
  };

  const revokeCredential = async (credentialId) => {
    if (!confirm('Are you sure you want to revoke this credential?')) return;
    
    try {
      await api.post(`/issuer/revoke/${credentialId}`);
      toast.success('Credential revoked successfully');
      fetchCredentials();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Revocation failed');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'issued':
        return <FiSend size={12} />;
      case 'verified':
        return <FiCheck size={12} />;
      case 'revoked':
        return <FiX size={12} />;
      default:
        return <FiActivity size={12} />;
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'issued':
        return '#00d4ff';
      case 'verified':
        return '#00ff88';
      case 'revoked':
        return '#ff5555';
      default:
        return '#888';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <SectionHeader
          title="Issued Credentials"
          subtitle={`${creds.length} credentials anchored on-chain`}
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchCredentials();
              fetchLogs();
            }}
            className="btn-neon px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2"
          >
            <FiRefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="btn-neon px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2"
          >
            <FiClock size={14} />
            {showLogs ? 'Hide Logs' : 'Show Logs'}
          </button>
        </div>
      </div>

      {/* Credential Activity Logs */}
      {showLogs && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-mono text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <FiActivity size={14} />
            Credential Activity Logs
          </h3>
          {logs.length === 0 ? (
            <EmptyState icon="📊" title="No logs" message="No credential activity recorded yet." />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 212, 255, 0.3) rgba(255, 255, 255, 0.05)'
            }}>
              {logs.map((log, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5" style={{ color: getActionColor(log.action) }}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-sm font-mono font-semibold text-slate-200">
                            {log.credential_id}
                          </span>
                          <Badge variant={log.action === 'issued' ? 'success' : log.action === 'revoked' ? 'error' : 'warning'}>
                            {log.action.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Holder ID:</span>
                            <span className="text-slate-300 font-mono ml-2">{log.holder_id}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Timestamp:</span>
                            <span className="text-slate-300 ml-2">{formatDate(log.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Credentials List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={32} />
        </div>
      ) : creds.length === 0 ? (
        <EmptyState
          icon="🔏"
          title="No credentials issued"
          message="Issue your first credential to get started."
        />
      ) : (
        <div className="grid gap-4">
          {creds.map((cred, i) => (
            <div key={i} className="glass glass-hover rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-xl">
                    🔏
                  </div>
                  <div>
                    <div className="font-mono text-sm font-semibold text-slate-200">
                      {cred.credential_id}
                    </div>
                    <div className="font-mono text-xs text-slate-500">
                      Type: {cred.credential_type} • Issued: {formatDate(cred.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant={cred.revoked ? 'error' : 'success'}>
                    {cred.revoked ? 'Revoked' : 'Active'}
                  </Badge>
                  
                  {!cred.revoked && (
                    <button
                      onClick={() => revokeCredential(cred.credential_id)}
                      className="px-2 py-1 rounded-lg text-xs font-mono text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">Holder ID:</div>
                <div className="text-slate-300 font-mono">{cred.holder_id}</div>
                
                <div className="text-slate-500">Hash ID:</div>
                <div className="text-slate-300 font-mono text-[10px] break-all">{cred.hash_id}</div>
                
                {cred.expires_at && (
                  <>
                    <div className="text-slate-500">Expires:</div>
                    <div className="text-slate-300">{formatDate(cred.expires_at)}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main Issuer Dashboard Component
export default function IssuerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/issuer', label: 'Issue Credential', icon: <FiPlus size={14} /> },
    { path: '/issuer/list', label: 'My Credentials', icon: <FiList size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`px-4 py-2 rounded-lg font-mono text-sm flex items-center gap-2 transition-all whitespace-nowrap
              ${location.pathname === tab.path 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Routes */}
      <Routes>
        <Route index element={<IssueForm />} />
        <Route path="list" element={<CredentialList />} />
      </Routes>
    </div>
  );
}