import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiShield, FiMenu, FiX, FiLogOut, FiUsers, FiCheckSquare,
  FiPlusSquare, FiList, FiCreditCard, FiClock, FiSearch, FiActivity,
} from 'react-icons/fi';

const NAV = {
  admin:    [
    { to: '/admin',          label: 'Users',        icon: FiUsers },
  ],
  issuer:   [
    { to: '/issuer',         label: 'Issue',        icon: FiPlusSquare },
    { to: '/issuer/list',    label: 'Credentials',  icon: FiList },
  ],
  holder:   [
    { to: '/holder',         label: 'Credentials',  icon: FiCreditCard },
    { to: '/holder/history', label: 'History',      icon: FiClock },
  ],
  verifier: [
    { to: '/verifier',       label: 'Verify',       icon: FiSearch },
    { to: '/verifier/history', label: 'History',    icon: FiActivity },
  ],
};

const ROLE_COLOR = {
  admin: '#ff00ff', issuer: '#00d4ff', holder: '#00ff88', verifier: '#f59e0b',
};

const ROLE_ICON = {
  admin: '⚡', issuer: '🔏', holder: '🪪', verifier: '🔍',
};

export default function DashboardLayout({ children, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Session terminated');
    navigate('/login');
  };

  const color = ROLE_COLOR[role] || '#00d4ff';
  const navItems = NAV[role] || [];
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      {/* Brand */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center glass"
            style={{ boxShadow: `0 0 20px ${color}44` }}>
            <FiShield size={18} style={{ color }} />
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-widest" style={{ color }}>TIV-HE</div>
            <div className="font-mono text-xs text-slate-600">v2.0 · encrypted</div>
          </div>
        </div>
      </div>

      {/* User badge */}
      <div className="px-4 py-4 border-b mx-3 mt-3 glass rounded-xl" style={{ borderColor: `${color}33` }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{ROLE_ICON[role]}</span>
          <div>
            <div className="font-mono text-xs font-semibold" style={{ color }}>{user?.email?.split('@')[0]}</div>
            <div className="font-mono text-xs text-slate-500 capitalize">{role} node</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === `/${role}`}
            className={({ isActive }) =>
              `sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono transition-all ${isActive ? 'active' : 'text-slate-400'}`
            }
            onClick={() => setSidebarOpen(false)}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono text-slate-400
            hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-transparent transition-all">
          <FiLogOut size={16} /> Disconnect
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-grid hex-bg" style={{ background: '#020408' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 glass border-r" style={{ borderColor: 'rgba(0,212,255,0.1)', minHeight: '100vh' }}>
        <Sidebar />
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 glass border-r flex flex-col z-10"
            style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 glass border-b sticky top-0 z-40"
          style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={22} />
            </button>
            <div>
              <h1 className="font-display text-sm font-bold tracking-widest" style={{ color }}>
                {role.toUpperCase()} CONSOLE
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
                <span className="font-mono text-xs text-slate-600">Chain: ACTIVE · Block #441972</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block font-mono text-xs text-slate-600 px-3 py-1.5 glass rounded-lg">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
