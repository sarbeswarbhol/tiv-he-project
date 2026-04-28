import { useState } from 'react';

/* ─── Spinner ─────────────────────────────────────────────── */
export function Spinner({ size = 20 }) {
  return (
    <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--c-accent)" strokeWidth="2.5" strokeOpacity=".25" />
      <path fill="var(--c-accent)" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ─── Skeleton ────────────────────────────────────────────── */
export function Skeleton({ className = '', style = {} }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

/* ─── Empty State ─────────────────────────────────────────── */
export function EmptyState({ icon = '📭', title = 'No data', message = 'Nothing to display yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-4xl mb-4 float">{icon}</div>
      <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</h3>
      <p className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 260 }}>{message}</p>
    </div>
  );
}

/* ─── Badge ───────────────────────────────────────────────── */
export function Badge({ variant = 'info', children }) {
  const cls = { success: 'badge-success', error: 'badge-error', warning: 'badge-warning', info: 'badge-info' };
  return <span className={`badge ${cls[variant] || 'badge-info'}`}>{children}</span>;
}

/* ─── Stat Card ───────────────────────────────────────────── */
export function StatCard({ label, value, icon, color = 'var(--c-accent)', loading }) {
  return (
    <div className="card card-hover" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span className="label" style={{ margin: 0, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      {loading
        ? <Skeleton style={{ height: 36, width: 80 }} />
        : <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 34, color, lineHeight: 1 }}>{value}</div>
      }
    </div>
  );
}

/* ─── Section Header ──────────────────────────────────────── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 20px 14px', borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div>
        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: subtitle ? 2 : 0 }}>{title}</h2>
        {subtitle && <p className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Copy Button ─────────────────────────────────────────── */
export function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className={`btn btn-sm ${copied ? 'btn-success' : 'btn-ghost'}`}>
      {copied ? '✓ Copied' : label}
    </button>
  );
}

/* ─── Result Indicator ────────────────────────────────────── */
export function ResultIndicator({ value, label }) {
  const isTrue = value === true || value === 'true' || String(value).toLowerCase() === 'true';
  return (
    <div className={isTrue ? 'result-true' : 'result-false'} style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 48, color: isTrue ? 'var(--c-green)' : 'var(--c-red)', lineHeight: 1 }}>
        {isTrue ? 'TRUE' : 'FALSE'}
      </div>
      <div className="label" style={{ margin: 0, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

/* ─── Field Input (with label + icon slot) ────────────────── */
export function Field({ label, icon, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span className="label">{label}</span>}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        {children}
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/* ─── Info Row (key-value pair in cards) ──────────────────── */
export function InfoRow({ label, value, mono = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono,monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: mono ? 'IBM Plex Mono,monospace' : 'Outfit,sans-serif', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
