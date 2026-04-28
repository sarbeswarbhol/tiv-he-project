import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiShield, FiMenu, FiX, FiLogOut, FiUsers, FiCheckSquare,
  FiPlusSquare, FiList, FiCreditCard, FiClock, FiSearch, FiActivity,
} from 'react-icons/fi';

/* ── Navigation config ──────────────────────────────────── */
const NAV = {
  admin:    [{ to: '/admin',            label: 'Users',       icon: FiUsers }],
  issuer:   [{ to: '/issuer',           label: 'Issue',       icon: FiPlusSquare },
             { to: '/issuer/list',      label: 'Credentials', icon: FiList }],
  holder:   [{ to: '/holder',           label: 'Credentials', icon: FiCreditCard },
             { to: '/holder/history',   label: 'History',     icon: FiClock }],
  verifier: [{ to: '/verifier',         label: 'Verify',      icon: FiSearch },
             { to: '/verifier/history', label: 'History',     icon: FiActivity }],
};

/* ── Role theming ─────────────────────────────────────────── */
const ROLE = {
  admin:    { color: 'var(--c-admin)',    icon: '⚡', label: 'Admin' },
  issuer:   { color: 'var(--c-issuer)',   icon: '🔏', label: 'Issuer' },
  holder:   { color: 'var(--c-holder)',   icon: '🪪', label: 'Holder' },
  verifier: { color: 'var(--c-verifier)', icon: '🔍', label: 'Verifier' },
};

/* ── Sidebar ─────────────────────────────────────────────── */
function Sidebar({ role, user, color, navItems, onClose, onLogout }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Brand */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-raised)', border: `1px solid ${color}55`,
            boxShadow: `0 0 12px ${color}22`,
          }}>
            <FiShield size={17} style={{ color }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 14, letterSpacing: '0.12em', color }}>TIV-HE</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>v2.0 · encrypted</div>
          </div>
        </div>
      </div>

      {/* User badge */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--bg-raised)', border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>{ROLE[role]?.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 12, fontWeight: 600, color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email?.split('@')[0]}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ROLE[role]?.label} node</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="label" style={{ paddingLeft: 12, marginBottom: 4 }}>Navigation</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === `/${role}`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px 10px 18px', borderTop: '1px solid var(--border-subtle)' }}>
        <button onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            color: 'var(--text-muted)', background: 'none', border: '1px solid transparent',
            cursor: 'pointer', transition: 'all .15s', fontFamily: 'Outfit,sans-serif',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-red)'; e.currentTarget.style.background = 'rgba(248,113,113,.08)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}>
          <FiLogOut size={14} /> Disconnect
        </button>
      </div>
    </div>
  );
}

/* ── Layout ──────────────────────────────────────────────── */
export default function DashboardLayout({ children, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); toast.success('Session terminated'); navigate('/login'); };
  const color = ROLE[role]?.color || 'var(--c-accent)';
  const navItems = NAV[role] || [];

  return (
    <div className="app-bg" style={{ minHeight: '100vh', display: 'flex' }}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col" style={{
        width: 'var(--sidebar-w)', flexShrink: 0, minHeight: '100vh',
        borderRight: '1px solid var(--border-subtle)',
        background: 'rgba(7,7,13,0.75)', backdropFilter: 'blur(24px)',
      }}>
        <Sidebar role={role} user={user} color={color} navItems={navItems} onClose={() => {}} onLogout={handleLogout} />
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="md:hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.70)', backdropFilter: 'blur(4px)' }} onClick={() => setDrawerOpen(false)} />
          <aside style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 248,
            background: 'rgba(7,7,13,0.97)', borderRight: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', zIndex: 10,
          }}>
            <button onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', top: 14, right: 14, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <FiX size={18} />
            </button>
            <Sidebar role={role} user={user} color={color} navItems={navItems} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 60,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(7,7,13,0.80)', backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="md:hidden" onClick={() => setDrawerOpen(true)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
              <FiMenu size={20} />
            </button>
            <div>
              <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.12em', color }}>
                {role.toUpperCase()} CONSOLE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-green)', display: 'inline-block' }} />
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>Chain: ACTIVE · Block #441972</span>
              </div>
            </div>
          </div>

          {/* Clock */}
          <div className="mono hidden sm:flex" style={{
            fontSize: 12, color: 'var(--text-secondary)',
            padding: '5px 14px', borderRadius: 7,
            background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
          }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </header>

        {/* Content */}
        <main className="fade-up" style={{ flex: 1, padding: '28px 24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
