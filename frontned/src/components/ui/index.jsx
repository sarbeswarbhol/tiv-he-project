import { useState } from "react";

/* ─── Spinner ─────────────────────────────────────────────── */
export function Spinner({ size = 20, color = "var(--c-accent)" }) {
  return (
    <svg
      className="spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0 }}>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2.5"
        strokeOpacity=".2"
      />
      <path fill={color} d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ─── Skeleton ────────────────────────────────────────────── */
export function Skeleton({ className = "", style = {} }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

/* ─── Empty State ─────────────────────────────────────────── */
export function EmptyState({
  icon = "📭",
  title = "No data",
  message = "Nothing to display yet.",
  action,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 24px",
        textAlign: "center",
        gap: 0,
      }}>
      {/* Glowing icon container */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--bg-raised) 60%, transparent 100%)",
          border: "1px solid var(--border-medium)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
          marginBottom: 18,
          boxShadow: "0 0 24px var(--bg-raised)",
        }}
        className="float">
        {icon}
      </div>
      <h3
        style={{
          fontFamily: "Outfit, sans-serif",
          fontWeight: 700,
          fontSize: 15,
          color: "var(--text-secondary)",
          marginBottom: 8,
          letterSpacing: "0.01em",
        }}>
        {title}
      </h3>
      <p
        className="mono"
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          maxWidth: 280,
          lineHeight: 1.6,
          marginBottom: action ? 20 : 0,
        }}>
        {message}
      </p>
      {action && action}
    </div>
  );
}

/* ─── Badge ───────────────────────────────────────────────── */
export function Badge({ variant = "info", children, dot = false }) {
  const cls = {
    success: "badge-success",
    error: "badge-error",
    warning: "badge-warning",
    info: "badge-info",
  };

  const dotColors = {
    success: "var(--c-green)",
    error: "var(--c-red)",
    warning: "var(--c-amber)",
    info: "var(--c-blue)",
  };

  return (
    <span
      className={`badge ${cls[variant] || "badge-info"}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: dotColors[variant] || dotColors.info,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

/* ─── Stat Card ───────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  icon,
  color = "var(--c-accent)",
  loading,
  trend,
}) {
  return (
    <div
      className="card card-hover"
      style={{
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Subtle glow in corner */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
        }}>
        {/* Icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `color-mix(in srgb, ${color} 12%, var(--bg-raised))`,
            border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}>
          {icon}
        </div>
        <span
          className="label"
          style={{ margin: 0, color: "var(--text-muted)", fontSize: 11 }}>
          {label}
        </span>
      </div>

      {loading ? (
        <Skeleton style={{ height: 38, width: 80, borderRadius: 8 }} />
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 800,
              fontSize: 36,
              color,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}>
            {value ?? "—"}
          </div>
          {trend !== undefined && (
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: trend >= 0 ? "var(--c-green)" : "var(--c-red)",
                paddingBottom: 4,
              }}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Mini Stat (compact, for role distribution rows) ────── */
export function MiniStat({ label, value, color = "var(--c-accent)", loading }) {
  return (
    <div
      className="card"
      style={{
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
        <span
          className="mono"
          style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton style={{ height: 20, width: 30, borderRadius: 4 }} />
      ) : (
        <span
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color,
            lineHeight: 1,
          }}>
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

/* ─── Section Header ──────────────────────────────────────── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px 14px",
        borderBottom: "1px solid var(--border-subtle)",
        gap: 12,
        flexWrap: "wrap",
      }}>
      <div>
        <h2
          style={{
            fontFamily: "Outfit, sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--text-primary)",
            marginBottom: subtitle ? 3 : 0,
            letterSpacing: "0.01em",
          }}>
          {title}
        </h2>
        {subtitle && (
          <p
            className="mono"
            style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>{action}</div>
      )}
    </div>
  );
}

/* ─── Copy Button ─────────────────────────────────────────── */
export function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={`btn btn-sm ${copied ? "btn-success" : "btn-ghost"}`}
      style={{ transition: "all .2s" }}>
      {copied ? "✓ Copied" : label}
    </button>
  );
}

/* ─── Result Indicator ────────────────────────────────────── */
export function ResultIndicator({ value, label }) {
  const isTrue =
    value === true ||
    value === "true" ||
    String(value).toLowerCase() === "true";

  return (
    <div
      className={isTrue ? "result-true" : "result-false"}
      style={{
        padding: "36px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${
            isTrue ? "rgba(74,222,128,.08)" : "rgba(248,113,113,.08)"
          } 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          fontFamily: "Outfit, sans-serif",
          fontWeight: 900,
          fontSize: 52,
          color: isTrue ? "var(--c-green)" : "var(--c-red)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}>
        {isTrue ? "VALID" : "INVALID"}
      </div>
      <div
        className="label"
        style={{ margin: 0, color: "var(--text-muted)", fontSize: 11 }}>
        {label}
      </div>
    </div>
  );
}

/* ─── Field Input (with label + icon slot) ────────────────── */
export function Field({ label, icon, children, hint, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <span className="label" style={{ display: "flex", gap: 4 }}>
          {label}
          {required && (
            <span style={{ color: "var(--c-red)", fontSize: 12 }}>*</span>
          )}
        </span>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              display: "flex",
              pointerEvents: "none",
              zIndex: 1,
            }}>
            {icon}
          </span>
        )}
        {children}
      </div>
      {hint && (
        <span
          className="hint"
          style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
          {hint}
        </span>
      )}
    </div>
  );
}

/* ─── Info Row (key-value pair in cards) ──────────────────── */
export function InfoRow({ label, value, mono = false, accent = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        padding: "9px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          fontFamily: "IBM Plex Mono, monospace",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          flexShrink: 0,
          paddingTop: 1,
        }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: accent ? "var(--c-accent)" : "var(--text-secondary)",
          fontFamily: mono ? "IBM Plex Mono, monospace" : "Outfit, sans-serif",
          fontWeight: 500,
          textAlign: "right",
          wordBreak: "break-all",
        }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

/* ─── Divider ─────────────────────────────────────────────── */
export function Divider({ label }) {
  if (!label)
    return (
      <div
        style={{
          height: 1,
          background: "var(--border-subtle)",
          margin: "4px 0",
        }}
      />
    );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "8px 0",
      }}>
      <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
      <span
        className="mono"
        style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
    </div>
  );
}

/* ─── Alert Banner ────────────────────────────────────────── */
export function Alert({ variant = "info", title, children, onClose }) {
  const config = {
    success: {
      color: "var(--c-green)",
      bg: "rgba(74,222,128,.07)",
      border: "rgba(74,222,128,.2)",
      icon: "✓",
    },
    error: {
      color: "var(--c-red)",
      bg: "rgba(248,113,113,.07)",
      border: "rgba(248,113,113,.2)",
      icon: "✕",
    },
    warning: {
      color: "var(--c-amber)",
      bg: "rgba(251,191,36,.07)",
      border: "rgba(251,191,36,.2)",
      icon: "⚠",
    },
    info: {
      color: "var(--c-blue)",
      bg: "rgba(96,165,250,.07)",
      border: "rgba(96,165,250,.2)",
      icon: "ℹ",
    },
  };
  const { color, bg, border, icon } = config[variant] || config.info;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        background: bg,
        border: `1px solid ${border}`,
        alignItems: "flex-start",
      }}>
      <span
        style={{
          fontSize: 14,
          color,
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 1,
        }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color,
              marginBottom: children ? 4 : 0,
            }}>
            {title}
          </div>
        )}
        {children && (
          <div
            className="mono"
            style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {children}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            fontSize: 16,
            lineHeight: 1,
            flexShrink: 0,
          }}>
          ×
        </button>
      )}
    </div>
  );
}

/* ─── Table ───────────────────────────────────────────────── */
export function Table({ columns, data, keyField, emptyState, loading }) {
  if (loading) {
    return (
      <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
        <Spinner size={28} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      emptyState || (
        <EmptyState icon="📋" title="No records" message="Nothing to show here." />
      )
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Mobile Card (for responsive table replacements) ──────── */
export function MobileCard({ children, style = {} }) {
  return (
    <div
      className="card"
      style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        ...style,
      }}>
      {children}
    </div>
  );
}

/* ─── Page Header ─────────────────────────────────────────── */
export function PageHeader({ title, subtitle, icon, action, color = "var(--c-accent)" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 4,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {icon && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `color-mix(in srgb, ${color} 12%, var(--bg-surface))`,
              border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: `0 0 16px color-mix(in srgb, ${color} 15%, transparent)`,
              flexShrink: 0,
            }}>
            {icon}
          </div>
        )}
        <div>
          <h1
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 800,
              fontSize: 22,
              color: "var(--text-primary)",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}>
            {title}
          </h1>
          {subtitle && (
            <p
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 4,
                lineHeight: 1.4,
              }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}