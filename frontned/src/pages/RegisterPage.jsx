import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiShield, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiZap, FiTag } from 'react-icons/fi';
import { Spinner, Field } from '../components/ui/index';

const ROLES = ['holder', 'issuer', 'verifier'];

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'holder' });
  const [showPass, setShowPass] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading('Submitting registration...');
    const res = await register(form);
    toast.dismiss(tid);
    if (!res?.success) { toast.error(res?.error || 'Registration failed'); return; }
    toast.success('Request submitted. Await admin approval.');
    navigate('/login');
  };

  return (
    <div className="app-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>

      {/* Glow orbs */}
      <div style={{ position: 'fixed', top: '15%', right: '8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,.07), transparent)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,.06), transparent)', filter: 'blur(70px)', pointerEvents: 'none' }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="float" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', boxShadow: '0 0 28px var(--c-accent-glow)', marginBottom: 14 }}>
            <FiShield size={26} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '0.16em', color: 'var(--c-accent)', marginBottom: 4 }}>TIV-HE</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>NODE REGISTRATION</div>
        </div>

        {/* Form */}
        <div className="card card-accent" style={{ padding: 28 }}>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 6, color: 'var(--text-primary)' }}>Create Account</div>

          {/* Warning */}
          <div className="mono" style={{ fontSize: 11, color: 'var(--c-amber)', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.22)', borderRadius: 8, padding: '8px 12px', marginBottom: 20, textAlign: 'center' }}>
            ⚠ Access requires admin approval
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Full Name" icon={<FiUser size={14} />}>
              <input name="name" onChange={update} placeholder="John Doe" className="input input-icon" required />
            </Field>

            <Field label="Username" icon={<FiUser size={14} />}>
              <input name="username" onChange={update} placeholder="johndoe" className="input input-icon" required />
            </Field>

            <Field label="Email Address" icon={<FiMail size={14} />}>
              <input type="email" name="email" onChange={update} placeholder="user@example.com" className="input input-icon" required />
            </Field>

            <Field label="Password" icon={<FiLock size={14} />}>
              <input type={showPass ? 'text' : 'password'} name="password" onChange={update} placeholder="••••••••••••" className="input input-icon" style={{ paddingRight: 40 }} required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </Field>

            {/* Role selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="label">Node Role</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                    style={{ padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'IBM Plex Mono,monospace', cursor: 'pointer', transition: 'all .15s', textTransform: 'capitalize', border: `1px solid ${form.role === r ? 'var(--border-accent)' : 'var(--border-subtle)'}`, background: form.role === r ? 'var(--c-accent-dim)' : 'var(--bg-surface)', color: form.role === r ? 'var(--c-accent)' : 'var(--text-muted)' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 6 }}>
              {loading ? <><Spinner size={15} /> Processing...</> : <><FiZap size={14} /> Request Access</>}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Already have access?{' '}
            <span onClick={() => navigate('/login')} style={{ color: 'var(--c-accent)', cursor: 'pointer', textDecoration: 'underline' }}>Login</span>
          </span>
        </div>
        <div className="mono" style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', marginTop: 18, opacity: .6 }}>
          Zero-knowledge · End-to-end encrypted · Blockchain anchored
        </div>
      </div>
    </div>
  );
}
