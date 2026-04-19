// Spinner
export function Spinner({ size = 20 }) {
  return (
    <svg className="cyber-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="#00d4ff" strokeWidth="3" />
      <path className="opacity-80" fill="#00d4ff" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// Skeleton loader
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

// Empty state
export function EmptyState({ icon = '📭', title = 'No data', message = 'Nothing to display yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl">
      <div className="text-5xl mb-4 float-anim">{icon}</div>
      <h3 className="font-display text-base font-bold text-slate-300 tracking-wider mb-2">{title}</h3>
      <p className="font-mono text-xs text-slate-600 max-w-xs">{message}</p>
    </div>
  );
}

// Badge
export function Badge({ variant = 'info', children }) {
  return (
    <span className={`badge-${variant} inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold`}>
      {children}
    </span>
  );
}

// Stat card
export function StatCard({ label, value, icon, color = '#00d4ff', sub }) {
  return (
    <div className="glass glass-hover rounded-2xl p-5" style={{ borderColor: `${color}22` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, color, fontSize: 20 }}>
          {icon}
        </div>
        <span className="font-mono text-xs text-slate-600 uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-display text-3xl font-black" style={{ color }}>{value}</div>
      {sub && <div className="font-mono text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

// Section header
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-display text-lg font-bold text-slate-100 tracking-wider">{title}</h2>
        {subtitle && <p className="font-mono text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Copy button
export function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs transition-all
        ${copied ? 'badge-success' : 'btn-neon'}`}>
      {copied ? '✓ Copied' : label}
    </button>
  );
}

// We need useState imported
import { useState } from 'react';

// Result indicator
export function ResultIndicator({ value, label }) {
  const isTrue = value === true || value === 'true' || String(value).toLowerCase() === 'true';
  return (
    <div className={`${isTrue ? 'result-true' : 'result-false'} rounded-2xl p-6 flex flex-col items-center gap-2 transition-all`}>
      <div className={`font-display text-5xl font-black ${isTrue ? 'neon-green-text' : 'text-red-400'}`}>
        {isTrue ? 'TRUE' : 'FALSE'}
      </div>
      <div className="font-mono text-xs text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}
