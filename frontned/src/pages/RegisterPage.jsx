import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiShield, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiZap, FiTag } from 'react-icons/fi';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'holder',
  });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const tid = toast.loading('Submitting registration request...');
    const res = await register(form);
    toast.dismiss(tid);

    if (!res?.success) {
      toast.error(res?.error || 'Registration failed');
      return;
    }

    toast.success('Request submitted. Await admin approval.');
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen bg-grid hex-bg flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.08) 0%, transparent 60%), #020408',
      }}
    >
      {/* Floating orbs */}
      <div
        className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }}
      />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass mb-5 float-anim"
            style={{ boxShadow: '0 0 40px rgba(0,212,255,0.3)' }}
          >
            <FiShield size={36} className="neon-text" />
          </div>
          <h1 className="font-display text-3xl font-black tracking-widest neon-text mb-1">
            TIV-HE
          </h1>
          <p className="text-slate-400 font-mono text-xs tracking-widest uppercase">
            Trustless Identity Verification
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
            <span className="font-mono text-xs text-slate-500">
              Homomorphic Encryption Active
            </span>
          </div>
        </div>

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-200 tracking-wider mb-1">
            Node Registration
          </h2>

          {/* Disclaimer */}
          <div className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl p-2.5 text-center">
            ⚠ Access requires admin approval
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-slate-500 uppercase tracking-widest">
              Full Name
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                name="name"
                onChange={handleChange}
                placeholder="John Doe"
                className="input-cyber w-full pl-10 pr-4 py-2.5 rounded-xl font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-slate-500 uppercase tracking-widest">
              Username
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                name="username"
                onChange={handleChange}
                placeholder="johndoe"
                className="input-cyber w-full pl-10 pr-4 py-2.5 rounded-xl font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-slate-500 uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="email"
                name="email"
                onChange={handleChange}
                placeholder="user@example.com"
                className="input-cyber w-full pl-10 pr-4 py-2.5 rounded-xl font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-slate-500 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                onChange={handleChange}
                placeholder="••••••••••••"
                className="input-cyber w-full pl-10 pr-11 py-2.5 rounded-xl font-mono text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="font-mono text-xs text-slate-500 uppercase tracking-widest">
              Node Role
            </label>
            <div className="relative">
              <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input-cyber w-full pl-10 pr-4 py-2.5 rounded-xl font-mono text-sm appearance-none cursor-pointer"
              >
                <option value="holder">Holder</option>
                <option value="issuer">Issuer</option>
                <option value="verifier">Verifier</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-solid w-full py-3 rounded-xl font-display font-bold tracking-widest text-sm text-white flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <svg className="cyber-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <FiZap size={16} /> Request Access
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center font-mono text-xs text-slate-500 mt-4">
          Already have access?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-cyan-400 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>

        <p className="text-center font-mono text-xs text-slate-600 mt-6">
          Zero-knowledge · End-to-end encrypted · Blockchain anchored
        </p>
      </div>
    </div>
  );
}