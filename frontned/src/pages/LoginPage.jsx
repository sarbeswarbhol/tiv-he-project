import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  FiShield,
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiZap,
} from "react-icons/fi";
import { Spinner, Field } from "../components/ui/index";

const DEMO = [
  {
    role: "Admin",
    email: "admin@test.com",
    password: "admin123",
    color: "var(--c-admin)",
    icon: "⚡",
  },
  {
    role: "Issuer",
    email: "issuer@test.com",
    password: "issuer123",
    color: "var(--c-issuer)",
    icon: "🔏",
  },
  {
    role: "Holder",
    email: "holder@test.com",
    password: "holder123",
    color: "var(--c-holder)",
    icon: "🪪",
  },
  {
    role: "Verifier",
    email: "verifier@test.com",
    password: "verifier123",
    color: "var(--c-verifier)",
    icon: "🔍",
  },
];

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Authenticating...");
    const result = await login(email, password);
    toast.dismiss(tid);

    if (!result?.success) {
      toast.error(result?.error || "Authentication failed");
      return;
    }

    const role = result.role?.toLowerCase();
    toast.success(`Access granted — ${role?.toUpperCase()}`);
    navigate("/");
  };

  const autofill = (c) => {
    setEmail(c.email);
    setPassword(c.password);
    toast(`${c.icon} ${c.role} loaded`);
  };

  return (
    <div
      className="app-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "15%",
          left: "8%",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(45,212,191,.08), transparent)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "15%",
          right: "8%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(167,139,250,.08), transparent)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: 430,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            className="float"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 76,
              borderRadius: 20,
              background: "var(--bg-raised)",
              border: "1px solid var(--border-accent)",
              boxShadow: "0 0 36px var(--c-accent-glow)",
              marginBottom: 18,
            }}
          >
            <FiShield size={32} style={{ color: "var(--c-accent)" }} />
          </div>
          <div
            style={{
              fontFamily: "Outfit,sans-serif",
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: "0.18em",
              color: "var(--c-accent)",
              textShadow: "0 0 24px var(--c-accent-glow)",
              marginBottom: 6,
            }}
          >
            TIV-HE
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
            }}
          >
            TRUSTLESS IDENTITY VERIFICATION
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 10,
            }}
          >
            <span
              className="pulse-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--c-green)",
                display: "inline-block",
              }}
            />
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--text-muted)" }}
            >
              Homomorphic Encryption Active
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 14 }}>
          <div
            className="label"
            style={{ textAlign: "center", marginBottom: 12 }}
          >
            Quick Access — Demo Nodes
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {DEMO.map((c) => (
              <button
                key={c.role}
                onClick={() => autofill(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "IBM Plex Mono,monospace",
                  cursor: "pointer",
                  transition: "all .15s",
                  background: "var(--bg-surface)",
                  border: `1px solid ${c.color}44`,
                  color: c.color,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${c.color}18`;
                  e.currentTarget.style.borderColor = `${c.color}77`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-surface)";
                  e.currentTarget.style.borderColor = `${c.color}44`;
                }}
              >
                {c.icon} {c.role}
              </button>
            ))}
          </div>
        </div>

        <div className="card card-accent" style={{ padding: 28 }}>
          <div
            style={{
              fontFamily: "Outfit,sans-serif",
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 22,
              color: "var(--text-primary)",
            }}
          >
            Secure Login
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Field label="Node Identity" icon={<FiMail size={14} />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@blockchain.node"
                className="input input-icon"
                required
              />
            </Field>

            <Field label="Passphrase" icon={<FiLock size={14} />}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input input-icon"
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  padding: 4,
                  borderRadius: 4,
                  transition: "color .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-secondary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: 14,
                marginTop: 4,
              }}
            >
              {loading ? (
                <>
                  <Spinner size={15} /> Verifying...
                </>
              ) : (
                <>
                  <FiZap size={14} /> Authenticate
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span
            className="mono"
            style={{ fontSize: 12, color: "var(--text-muted)" }}
          >
            New node?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{
                color: "var(--c-accent)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Request Access
            </span>
          </span>
        </div>

        <div
          className="mono"
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "var(--text-disabled)",
            marginTop: 18,
            opacity: 0.7,
          }}
        >
          Zero-knowledge · End-to-end encrypted · Blockchain anchored
        </div>
      </div>
    </div>
  );
}