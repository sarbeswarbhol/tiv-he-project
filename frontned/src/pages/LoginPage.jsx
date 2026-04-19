import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiShield, FiLock, FiMail, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';

const DEMO_CREDS = [
  { role: 'Admin',    email: 'admin@test.com',    password: 'admin123',    color: '#ff00ff', icon: '⚡' },
  { role: 'Issuer',  email: 'issuer@test.com',   password: 'issuer123',   color: '#00d4ff', icon: '🔏' },
  { role: 'Holder',  email: 'holder@test.com',   password: 'holder123',   color: '#00ff88', icon: '🪪' },
  { role: 'Verifier',email: 'verifier@test.com', password: 'verifier123', color: '#f59e0b', icon: '🔍' },
];

const ROLE_ROUTES = { admin: '/admin', issuer: '/issuer', holder: '/holder', verifier: '/verifier' };

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tid = toast.loading('Authenticating on blockchain...');
    const result = await login(email, password);
    toast.dismiss(tid);

    // ✅ FIXED (safe handling)
    if (!result?.success) {
      toast.error(result?.error || 'Authentication failed');
      return;
    }

    toast.success(`Access granted — ${result.role.toUpperCase()} node`);
    navigate(ROLE_ROUTES[result.role] || '/');
  };

  const autofill = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    toast(`Demo credentials loaded: ${cred.role}`, { icon: cred.icon });
  };

  return (
    <div className="min-h-screen bg-grid hex-bg flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.08) 0%, transparent 60%), #020408' }}>

      <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

      <div className="w-full max-w-md relative z-10">

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass mb-5 float-anim"
            style={{ boxShadow: '0 0 40px rgba(0,212,255,0.3)' }}>
            <FiShield size={36} className="neon-text" />
          </div>
          <h1 className="font-display text-3xl font-black tracking-widest neon-text mb-1">TIV-HE</h1>
          <p className="text-slate-400 font-mono text-xs tracking-widest uppercase">Trustless Identity Verification</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
            <span className="font-mono text-xs text-slate-500">Homomorphic Encryption Active</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 mb-6">
          <p className="font-mono text-xs text-slate-500 uppercase tracking-widest mb-3 text-center">Quick Access — Demo Nodes</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_CREDS.map((c) => (
              <button key={c.role} onClick={() => autofill(c)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `rgba(${c.color === '#ff00ff' ? '255,0,255' : c.color === '#00d4ff' ? '0,212,255' : c.color === '#00ff88' ? '0,255,136' : '245,158,11'},0.1)`,
                  border: `1px solid ${c.color}44`,
                  color: c.color,
                  boxShadow: `0 0 12px ${c.color}22`,
                }}>
                <span>{c.icon}</span> {c.role}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-7 space-y-5">
          <h2 className="font-display text-lg font-bold text-slate-200 tracking-wider mb-1">Secure Login</h2>

          <div className="space-y-1">
            <label className="font-mono text-xs text-slate-500 uppercase tracking-widest">Node Identity</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@blockchain.node"
                className="input-cyber w-full pl-10 pr-4 py-3 rounded-xl font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-xs text-slate-500 uppercase tracking-widest">Passphrase</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input-cyber w-full pl-10 pr-11 py-3 rounded-xl font-mono text-sm"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-solid w-full py-3.5 rounded-xl font-display font-bold tracking-widest text-sm text-white flex items-center justify-center gap-2 mt-2">
            {loading ? (
              <>
                <svg className="cyber-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Verifying...
              </>
            ) : (
              <><FiZap size={16} /> Authenticate</>
            )}
          </button>
        </form>

        {/* ✅ ADDED REGISTER LINK (same theme) */}
        <p className="text-center font-mono text-xs text-slate-500 mt-4">
          New node?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-cyan-400 cursor-pointer hover:underline"
          >
            Request Access
          </span>
        </p>

        <p className="text-center font-mono text-xs text-slate-600 mt-6">
          Zero-knowledge · End-to-end encrypted · Blockchain anchored
        </p>

      </div>
    </div>
  );
}