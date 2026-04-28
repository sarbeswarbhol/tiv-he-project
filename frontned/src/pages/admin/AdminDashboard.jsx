import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Spinner,
  EmptyState,
  Badge,
  StatCard,
  SectionHeader,
} from "../../components/ui/index";
import {
  FiCheck,
  FiX,
  FiRefreshCw,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiAward,
  FiLogIn,
  FiUser,
  FiFilter,
  FiTrendingUp,
} from "react-icons/fi";

/* ── Constants ───────────────────────────────────────────── */
const ROLE_COLOR = {
  admin: "var(--c-admin)",
  issuer: "var(--c-issuer)",
  holder: "var(--c-holder)",
  verifier: "var(--c-verifier)",
};
const LOG_MAP = {
  USER_APPROVED: {
    icon: <FiUserCheck size={13} />,
    color: "var(--c-green)",
    label: "User Approved",
  },
  USER_REJECTED: {
    icon: <FiUserX size={13} />,
    color: "var(--c-red)",
    label: "User Rejected",
  },
  USER_UNAPPROVED: {
    icon: <FiRefreshCw size={13} />,
    color: "var(--c-amber)",
    label: "Reset to Pending",
  },
  USER_REGISTERED: {
    icon: <FiUserPlus size={13} />,
    color: "var(--c-blue)",
    label: "User Registered",
  },
  ISSUER_ADDED: {
    icon: <FiAward size={13} />,
    color: "var(--c-admin)",
    label: "Issuer Added",
  },
  VERIFIER_ADDED: {
    icon: <FiShield size={13} />,
    color: "var(--c-verifier)",
    label: "Verifier Added",
  },
  HOLDER_ADDED: {
    icon: <FiUser size={13} />,
    color: "var(--c-holder)",
    label: "Holder Added",
  },
};

const formatTime = (ts) => {
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60) return "Just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

/* ── Role pill ───────────────────────────────────────────── */
function RolePill({ role }) {
  const c = ROLE_COLOR[role] || "var(--c-accent)";
  return (
    <span
      className="mono"
      style={{
        padding: "3px 9px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        background: `color-mix(in srgb, ${c} 12%, transparent)`,
        color: c,
        border: `1px solid color-mix(in srgb, ${c} 28%, transparent)`,
      }}>
      {role.toUpperCase()}
    </span>
  );
}

/* ── Action buttons for a user row ──────────────────────── */
function UserActions({ user, actionState, onApprove, onReject, onReset }) {
  const busy = actionState?.id === user.public_id;
  if (user.status === "pending")
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onApprove(user.public_id)}
          disabled={busy}
          className="btn btn-sm btn-success">
          {busy && actionState.type === "approve" ? (
            <Spinner size={11} />
          ) : (
            <FiCheck size={12} />
          )}{" "}
          Approve
        </button>
        <button
          onClick={() => onReject(user.public_id)}
          disabled={busy}
          className="btn btn-sm btn-danger">
          {busy && actionState.type === "reject" ? (
            <Spinner size={11} />
          ) : (
            <FiX size={12} />
          )}{" "}
          Reject
        </button>
      </div>
    );
  return (
    <button
      onClick={() => onReset(user.public_id)}
      disabled={busy}
      className="btn btn-sm btn-warning">
      {busy && actionState.type === "reset" ? (
        <Spinner size={11} />
      ) : (
        <FiRefreshCw size={12} />
      )}{" "}
      Reset
    </button>
  );
}

/* ── AdminDashboard ──────────────────────────────────────── */
export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    users: { total: 0, pending: 0, approved: 0, rejected: 0 },
    roles: { admins: 0, issuers: 0, holders: 0, verifiers: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionState, setActionState] = useState(null);
  const [filters, setFilters] = useState({ status: "", role: "" });
  const [showFilters, setShowFilters] = useState(false);

  const currentUserId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("tiv_user"))?.public_id;
    } catch {
      return null;
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await api.get("/admin/dashboard");
      setStats(r.data);
    } catch {
      toast.error("Failed to load statistics");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.role) params.role = filters.role;
      const r = await api.get("/admin/users", { params });
      setUsers(r.data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const r = await api.get("/admin/logs");
      setLogs(r.data);
    } catch {
      toast.error("Failed to load logs");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), fetchUsers(), fetchLogs()]);
  }, [fetchStats, fetchUsers, fetchLogs]);

  const doAction = async (publicId, type, endpoint, label) => {
    setActionState({ id: publicId, type });
    try {
      await api.post(`/admin/${endpoint}/${publicId}`);
      toast.success(label);
      setUsers((prev) =>
        prev.map((u) =>
          u.public_id === publicId
            ? {
                ...u,
                status:
                  type === "approve"
                    ? "approved"
                    : type === "reject"
                      ? "rejected"
                      : "pending",
              }
            : u,
        ),
      );
      await Promise.all([fetchStats(), fetchLogs()]);
    } catch (e) {
      toast.error(e.response?.data?.detail || `${label} failed`);
    } finally {
      setActionState(null);
    }
  };

  const approve = (id) => doAction(id, "approve", "approve", "User approved");
  const reject = (id) => doAction(id, "reject", "reject", "User rejected");
  const reset = (id) =>
    doAction(id, "reset", "unapprove", "User reset to pending");

  return (
    <div
      className="fade-up"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
        }}
        className="grid-cols-2 sm:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.users.total}
          icon="👥"
          color="var(--c-blue)"
          loading={statsLoading}
        />
        <StatCard
          label="Pending"
          value={stats.users.pending}
          icon="⏳"
          color="var(--c-amber)"
          loading={statsLoading}
        />
        <StatCard
          label="Approved"
          value={stats.users.approved}
          icon="✅"
          color="var(--c-green)"
          loading={statsLoading}
        />
        <StatCard
          label="Rejected"
          value={stats.users.rejected}
          icon="🚫"
          color="var(--c-red)"
          loading={statsLoading}
        />
      </div>

      {/* Role distribution */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 10,
        }}>
        {[
          ["Admins", "var(--c-admin)", stats.roles.admins],
          ["Issuers", "var(--c-issuer)", stats.roles.issuers],
          ["Holders", "var(--c-holder)", stats.roles.holders],
          ["Verifiers", "var(--c-verifier)", stats.roles.verifiers],
        ].map(([label, color, val]) => (
          <div key={label} className="card" style={{ padding: "14px 16px" }}>
            <div className="label" style={{ color }}>
              {label}
            </div>
            <div
              style={{
                fontFamily: "Outfit,sans-serif",
                fontWeight: 800,
                fontSize: 26,
                color,
                lineHeight: 1,
                marginTop: 4,
              }}>
              {statsLoading ? "…" : val}
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="card">
        <SectionHeader
          title="User Management"
          subtitle="Manage platform users and access"
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className="btn btn-ghost btn-sm">
                <FiFilter size={13} /> Filters
              </button>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="btn btn-ghost btn-sm">
                <FiRefreshCw size={13} className={loading ? "spin" : ""} />{" "}
                Refresh
              </button>
            </div>
          }
        />

        {/* Filter panel */}
        {showFilters && (
          <div style={{ padding: "0 20px 16px" }}>
            <div
              className="card"
              style={{
                padding: 16,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}>
              {[
                ["Status", "status", ["", "pending", "approved", "rejected"]],
                ["Role", "role", ["", "admin", "issuer", "holder", "verifier"]],
              ].map(([label, key, opts]) => (
                <div key={key} style={{ flex: "1 1 140px" }}>
                  <span className="label">{label}</span>
                  <select
                    value={filters[key]}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="input"
                    style={{ marginTop: 4 }}>
                    {opts.map((o) => (
                      <option key={o} value={o}>
                        {o || `All ${label}s`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                onClick={() => {
                  setFilters({ status: "", role: "" });
                  setShowFilters(false);
                }}
                className="btn btn-ghost btn-sm">
                Reset
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: "0 20px 20px" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "48px 0",
              }}>
              <Spinner size={30} />
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No users found"
              message="No users match the selected filters."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block" style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Public ID</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isMe = u.public_id === currentUserId;
                      return (
                        <tr key={u.public_id}>
                          <td>
                            <span
                              className="mono"
                              style={{
                                fontSize: 12,
                                color: "var(--c-accent)",
                              }}>
                              {u.public_id}
                            </span>
                          </td>
                          <td>
                            <span
                              className="mono"
                              style={{
                                fontSize: 12,
                                color: "var(--text-secondary)",
                              }}>
                              {u.email}
                            </span>
                          </td>
                          <td>
                            <RolePill role={u.role} />
                          </td>
                          <td>
                            <Badge
                              variant={
                                u.status === "approved"
                                  ? "success"
                                  : u.status === "rejected"
                                    ? "error"
                                    : "warning"
                              }>
                              {u.status}
                            </Badge>
                          </td>
                          <td>
                            {isMe ? (
                              <span
                                className="mono"
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-muted)",
                                }}>
                                Current user
                              </span>
                            ) : (
                              <UserActions
                                user={u}
                                actionState={actionState}
                                onApprove={approve}
                                onReject={reject}
                                onReset={reset}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Activity logs */}
      <div className="card">
        <SectionHeader
          title="Activity Logs"
          subtitle="System and user action history"
          action={
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="btn btn-ghost btn-sm">
              <FiRefreshCw size={13} className={logsLoading ? "spin" : ""} />{" "}
              Refresh
            </button>
          }
        />
        <div style={{ padding: "0 20px 20px" }}>
          {logsLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "40px 0",
              }}>
              <Spinner size={26} />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No logs available"
              message="No activity recorded yet."
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: 480,
                overflowY: "auto",
                paddingRight: 4,
              }}>
              {logs.map((log, idx) => {
                const { icon, color, label } = LOG_MAP[log.action] || {
                  icon: <FiLogIn size={13} />,
                  color: "var(--text-muted)",
                  label: log.action.replace(/_/g, " "),
                };
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      transition: "background .15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-raised)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--bg-surface)")
                    }>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flex: 1,
                        minWidth: 0,
                      }}>
                      <span style={{ color, marginTop: 1, flexShrink: 0 }}>
                        {icon}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                            marginBottom: 3,
                          }}>
                          <span
                            className="mono"
                            style={{ fontSize: 12, fontWeight: 600, color }}>
                            {label}
                          </span>
                          <span
                            className="mono"
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                            }}>
                            by{" "}
                            <span style={{ color: "var(--c-accent)" }}>
                              {log.performed_by}
                            </span>
                          </span>
                        </div>
                        <div
                          className="mono"
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                          Target: {log.target_user || "System"}
                        </div>
                        {log.details && (
                          <div
                            className="mono"
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginTop: 2,
                              fontStyle: "italic",
                            }}>
                            "{log.details}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        className="mono"
                        style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {formatTime(log.timestamp)}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          opacity: 0.5,
                          marginTop: 2,
                        }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
