import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FiShield,
  FiMenu,
  FiX,
  FiLogOut,
  FiUsers,
  FiCheckSquare,
  FiPlusSquare,
  FiList,
  FiCreditCard,
  FiClock,
  FiSearch,
  FiActivity,
  FiChevronRight,
} from "react-icons/fi";

/* ── Navigation config ──────────────────────────────────────────── */
const NAV = {
  admin: [{ to: "/admin", label: "Users", icon: FiUsers }],
  issuer: [
    { to: "/issuer", label: "Issue", icon: FiPlusSquare },
    { to: "/issuer/list", label: "Credentials", icon: FiList },
  ],
  holder: [
    { to: "/holder", label: "Credentials", icon: FiCreditCard },
    { to: "/holder/history", label: "History", icon: FiClock },
  ],
  verifier: [
    { to: "/verifier", label: "Verify", icon: FiSearch },
    { to: "/verifier/history", label: "History", icon: FiActivity },
  ],
};

/* ── Role theming ───────────────────────────────────────────────── */
const ROLE = {
  admin: {
    color: "var(--c-admin)",
    icon: "⚡",
    label: "Admin",
    glyph: "⚡",
    description: "System Administrator",
  },
  issuer: {
    color: "var(--c-issuer)",
    icon: "🔏",
    label: "Issuer",
    glyph: "🔏",
    description: "Credential Issuer",
  },
  holder: {
    color: "var(--c-holder)",
    icon: "🪪",
    label: "Holder",
    glyph: "🪪",
    description: "Credential Holder",
  },
  verifier: {
    color: "var(--c-verifier)",
    icon: "🔍",
    label: "Verifier",
    glyph: "🔍",
    description: "Credential Verifier",
  },
};

/* ── Sidebar ────────────────────────────────────────────────────── */
function Sidebar({ role, user, color, navItems, onClose, onLogout }) {
  const roleInfo = ROLE[role] || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand */}
      <div
        style={{
          padding: "20px 18px 16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `color-mix(in srgb, ${color} 12%, var(--bg-raised))`,
              border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
              boxShadow: `0 0 16px color-mix(in srgb, ${color} 20%, transparent)`,
              flexShrink: 0,
            }}>
            <FiShield size={17} style={{ color }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: "0.14em",
                color,
                textTransform: "uppercase",
              }}>
              TIV-HE
            </div>
            {/* <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
              }}>
              v2.0 · encrypted
            </div> */}
          </div>
        </div>
      </div>

      {/* User badge */}
      <div style={{ padding: "12px 14px 8px" }}>
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: `color-mix(in srgb, ${color} 6%, var(--bg-raised))`,
            border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
          {/* Avatar circle */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: `color-mix(in srgb, ${color} 18%, var(--bg-surface))`,
              border: `2px solid color-mix(in srgb, ${color} 35%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              flexShrink: 0,
            }}>
            {roleInfo.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="mono"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
              {user?.email?.split("@")[0] || "user"}
            </div>
            <div
              className="mono"
              style={{ fontSize: 10, color: "var(--text-muted)" }}>
              {roleInfo.description || roleInfo.label}
            </div>
          </div>
        </div>
      </div>

      {/* Nav section */}
      <nav
        style={{
          flex: 1,
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}>
        <div
          className="label"
          style={{
            paddingLeft: 12,
            marginBottom: 6,
            marginTop: 4,
            fontSize: 10,
            letterSpacing: "0.10em",
          }}>
          Navigation
        </div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === `/${role}`}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
            <FiChevronRight
              size={12}
              style={{ color: "var(--text-muted)", opacity: 0.5 }}
            />
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div
        style={{
          padding: "10px 10px 18px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}>
        {/* Status dot */}
        {/* <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "0 12px",
            marginBottom: 4,
          }}>
          <span
            className="pulse-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--c-green)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            className="mono"
            style={{ fontSize: 10, color: "var(--text-muted)" }}>
            Node: Online
          </span>
        </div> */}

        <button
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "none",
            border: "1px solid transparent",
            cursor: "pointer",
            transition: "all .15s",
            fontFamily: "Outfit, sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--c-red)";
            e.currentTarget.style.background = "rgba(248,113,113,.07)";
            e.currentTarget.style.borderColor = "rgba(248,113,113,.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.background = "none";
            e.currentTarget.style.borderColor = "transparent";
          }}>
          <FiLogOut size={14} />
          Disconnect
        </button>
      </div>
    </div>
  );
}

/* ── Layout ─────────────────────────────────────────────────────── */
export default function DashboardLayout({ children, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setDrawerOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Session terminated");
    navigate("/login");
  };

  const color = ROLE[role]?.color || "var(--c-accent)";
  const navItems = NAV[role] || [];

  return (
    <div className="app-bg" style={{ minHeight: "100vh", display: "flex" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: "var(--sidebar-w)",
          flexShrink: 0,
          minHeight: "100vh",
          borderRight: "1px solid var(--border-subtle)",
          background: "rgba(7,7,13,0.80)",
          backdropFilter: "blur(28px)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}>
        <Sidebar
          role={role}
          user={user}
          color={color}
          navItems={navItems}
          onClose={() => {}}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50 }}
          className="md:hidden">
          {/* Backdrop */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,.75)",
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <aside
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 260,
              background: "rgba(7,7,13,0.97)",
              borderRight: "1px solid var(--border-subtle)",
              backdropFilter: "blur(28px)",
              display: "flex",
              flexDirection: "column",
              zIndex: 10,
              animation: "slideInLeft .2s ease",
            }}>
            {/* Close button */}
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                color: "var(--text-muted)",
                background: "var(--bg-raised)",
                border: "1px solid var(--border-medium)",
                borderRadius: 6,
                cursor: "pointer",
                padding: "4px 5px",
                display: "flex",
                lineHeight: 1,
                zIndex: 20,
              }}>
              <FiX size={16} />
            </button>
            <Sidebar
              role={role}
              user={user}
              color={color}
              navItems={navItems}
              onClose={() => setDrawerOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}>
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            height: 60,
            borderBottom: "1px solid var(--border-subtle)",
            background: "rgba(7,7,13,0.85)",
            backdropFilter: "blur(20px)",
            position: "sticky",
            top: 0,
            zIndex: 40,
            gap: 12,
          }}>
          {/* Left: hamburger + page title */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden"
              onClick={() => setDrawerOpen(true)}
              style={{
                color: "var(--text-secondary)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-medium)",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                padding: "6px 7px",
                flexShrink: 0,
              }}>
              <FiMenu size={18} />
            </button>

            {/* Page title area */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: "0.12em",
                  color,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>
                {role.toUpperCase()} CONSOLE
              </div>
              {/* <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 1,
                }}>
                <span
                  className="pulse-dot"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--c-green)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span
                  className="mono hidden sm:inline"
                  style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  Chain: ACTIVE · Block #441972
                </span>
              </div> */}
            </div>
          </div>

          {/* Right: role badge + clock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}>
            {/* Role pill — visible on sm+ */}
            <div
              className="hidden sm:flex"
              style={{
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 99,
                background: `color-mix(in srgb, ${color} 10%, var(--bg-surface))`,
                border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
              }}>
              <span style={{ fontSize: 12 }}>{ROLE[role]?.icon}</span>
              <span
                className="mono"
                style={{ fontSize: 11, color, fontWeight: 600 }}>
                {ROLE[role]?.label}
              </span>
            </div>

            {/* Clock */}
            <div
              className="mono hidden sm:flex"
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                padding: "5px 12px",
                borderRadius: 7,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-medium)",
                letterSpacing: "0.06em",
              }}>
              {time.toLocaleTimeString("en-US", { hour12: false })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="fade-up"
          style={{
            flex: 1,
            padding: "24px 20px 40px",
            maxWidth: "100%",
            overflowX: "hidden",
          }}>
          {children}
        </main>
      </div>
    </div>
  );
}