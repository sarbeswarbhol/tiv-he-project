import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Spinner,
  EmptyState,
  Badge,
  StatCard,
  MiniStat,
  SectionHeader,
  PageHeader,
  MobileCard,
  InfoRow,
  Alert,
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
  FiUsers,
  FiSliders,
} from "react-icons/fi";

/* ── Constants ─────────────────────────────────────────────────── */
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

/* ── Role pill ─────────────────────────────────────────────────── */
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
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        letterSpacing: "0.06em",
      }}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: c,
          boxShadow: `0 0 4px ${c}`,
          flexShrink: 0,
        }}
      />
      {role.toUpperCase()}
    </span>
  );
}

/* ── Action buttons ────────────────────────────────────────────── */
function UserActions({ user, actionState, onApprove, onReject, onReset }) {
  const busy = actionState?.id === user.public_id;

  if (user.status === "pending") {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onApprove(user.public_id)}
          disabled={busy}
          className="btn btn-sm btn-success"
          style={{ minWidth: 80 }}>
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
          className="btn btn-sm btn-danger"
          style={{ minWidth: 72 }}>
          {busy && actionState.type === "reject" ? (
            <Spinner size={11} />
          ) : (
            <FiX size={12} />
          )}{" "}
          Reject
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onReset(user.public_id)}
      disabled={busy}
      className="btn btn-sm btn-warning"
      style={{ minWidth: 76 }}>
      {busy && actionState.type === "reset" ? (
        <Spinner size={11} />
      ) : (
        <FiRefreshCw size={12} />
      )}{" "}
      Reset
    </button>
  );
}

/* ── AdminDashboard ────────────────────────────────────────────── */
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
  const reset = (id) => doAction(id, "reset", "unapprove", "User reset to pending");

  const hasActiveFilters = filters.status || filters.role;

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* Page header */}
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage users, roles, and monitor system activity"
        icon="⚡"
        color="var(--c-admin)"
      />

      {/* Primary stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
        }}>
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
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 8,
        }}>
        {[
          ["Admins", "var(--c-admin)", stats.roles.admins],
          ["Issuers", "var(--c-issuer)", stats.roles.issuers],
          ["Holders", "var(--c-holder)", stats.roles.holders],
          ["Verifiers", "var(--c-verifier)", stats.roles.verifiers],
        ].map(([label, color, val]) => (
          <MiniStat
            key={label}
            label={label}
            value={statsLoading ? null : val}
            color={color}
            loading={statsLoading}
          />
        ))}
      </div>

      {/* Pending users alert */}
      {!statsLoading && stats.users.pending > 0 && (
        <Alert variant="warning" title={`${stats.users.pending} user(s) awaiting approval`}>
          Review pending registrations below and approve or reject access.
        </Alert>
      )}

      {/* Users table card */}
      <div className="card">
        <SectionHeader
          title="User Management"
          subtitle="Manage platform users and access control"
          action={
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`btn btn-sm ${showFilters ? "btn-primary" : "btn-ghost"}`}
                style={{
                  position: "relative",
                }}>
                <FiSliders size={13} />
                Filters
                {hasActiveFilters && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--c-amber)",
                      border: "2px solid var(--bg-card)",
                    }}
                  />
                )}
              </button>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="btn btn-ghost btn-sm">
                <FiRefreshCw size={13} className={loading ? "spin" : ""} />
                Refresh
              </button>
            </div>
          }
        />

        {/* Filter panel */}
        {showFilters && (
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-raised)",
            }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}>
              {[
                ["Status", "status", ["", "pending", "approved", "rejected"]],
                ["Role", "role", ["", "admin", "issuer", "holder", "verifier"]],
              ].map(([label, key, opts]) => (
                <div key={key} style={{ flex: "1 1 140px", minWidth: 120 }}>
                  <span className="label" style={{ marginBottom: 6, display: "block" }}>
                    {label}
                  </span>
                  <select
                    value={filters[key]}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="input"
                    style={{ marginTop: 0 }}>
                    {opts.map((o) => (
                      <option key={o} value={o}>
                        {o ? o.charAt(0).toUpperCase() + o.slice(1) : `All ${label}s`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", paddingBottom: 0 }}>
                <button
                  onClick={() => {
                    setFilters({ status: "", role: "" });
                  }}
                  className="btn btn-ghost btn-sm"
                  disabled={!hasActiveFilters}>
                  Clear
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="btn btn-ghost btn-sm">
                  <FiX size={12} /> Close
                </button>
              </div>
            </div>

            {hasActiveFilters && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Active:
                </span>
                {filters.status && (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 99,
                      fontSize: 11,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--text-secondary)",
                    }}
                    className="mono">
                    status={filters.status}
                  </span>
                )}
                {filters.role && (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 99,
                      fontSize: 11,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--text-secondary)",
                    }}
                    className="mono">
                    role={filters.role}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: "0 0 4px" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                padding: "52px 0",
                flexDirection: "column",
              }}>
              <Spinner size={28} />
              <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Loading users…
              </span>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No users found"
              message={
                hasActiveFilters
                  ? "No users match the selected filters. Try adjusting or clearing them."
                  : "No users have registered yet."
              }
              action={
                hasActiveFilters ? (
                  <button
                    onClick={() => setFilters({ status: "", role: "" })}
                    className="btn btn-ghost btn-sm">
                    Clear filters
                  </button>
                ) : null
              }
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
                        <tr key={u.public_id} style={{ opacity: isMe ? 0.7 : 1 }}>
                          <td>
                            <span
                              className="mono"
                              style={{
                                fontSize: 12,
                                color: "var(--c-accent)",
                                letterSpacing: "0.03em",
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
                              dot
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
                                  fontStyle: "italic",
                                }}>
                                You
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

              {/* Mobile cards */}
              <div
                className="md:hidden"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "12px 16px",
                }}>
                {users.map((u) => {
                  const isMe = u.public_id === currentUserId;
                  return (
                    <MobileCard key={u.public_id} style={{ opacity: isMe ? 0.75 : 1 }}>
                      {/* Top row: email + status */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 8,
                        }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 13,
                            color: "var(--text-primary)",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}>
                          {u.email}
                          {isMe && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 10,
                                color: "var(--text-muted)",
                                fontStyle: "italic",
                              }}>
                              (you)
                            </span>
                          )}
                        </span>
                        <Badge
                          dot
                          variant={
                            u.status === "approved"
                              ? "success"
                              : u.status === "rejected"
                                ? "error"
                                : "warning"
                          }>
                          {u.status}
                        </Badge>
                      </div>

                      {/* Role + ID */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}>
                        <RolePill role={u.role} />
                        <span
                          className="mono"
                          style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {u.public_id}
                        </span>
                      </div>

                      {/* Actions */}
                      {!isMe && (
                        <div style={{ paddingTop: 4 }}>
                          <UserActions
                            user={u}
                            actionState={actionState}
                            onApprove={approve}
                            onReject={reject}
                            onReset={reset}
                          />
                        </div>
                      )}
                    </MobileCard>
                  );
                })}
              </div>

              {/* Footer count */}
              <div
                style={{
                  padding: "10px 20px 14px",
                  borderTop: "1px solid var(--border-subtle)",
                }}>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {users.length} user{users.length !== 1 ? "s" : ""}
                  {hasActiveFilters ? " (filtered)" : " total"}
                </span>
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
              <FiRefreshCw size={13} className={logsLoading ? "spin" : ""} />
              Refresh
            </button>
          }
        />
        <div style={{ padding: "4px 20px 20px" }}>
          {logsLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                padding: "44px 0",
                flexDirection: "column",
              }}>
              <Spinner size={26} />
              <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Loading activity…
              </span>
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No logs available"
              message="No activity has been recorded yet."
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 500,
                overflowY: "auto",
                paddingRight: 2,
                marginTop: 8,
              }}>
              {logs.map((log, idx) => {
                const { icon, color, label } = LOG_MAP[log.action] || {
                  icon: <FiLogIn size={13} />,
                  color: "var(--text-muted)",
                  label: log.action?.replace(/_/g, " ") || "Unknown Action",
                };
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "11px 14px",
                      borderRadius: 10,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      transition: "background .15s, border-color .15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-raised)";
                      e.currentTarget.style.borderColor = "var(--border-medium)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-surface)";
                      e.currentTarget.style.borderColor = "var(--border-subtle)";
                    }}>
                    {/* Left: icon + info */}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flex: 1,
                        minWidth: 0,
                        alignItems: "flex-start",
                      }}>
                      {/* Icon dot */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: `color-mix(in srgb, ${color} 12%, var(--bg-raised))`,
                          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color,
                          flexShrink: 0,
                          marginTop: 1,
                        }}>
                        {icon}
                      </div>

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
                            style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            by{" "}
                            <span style={{ color: "var(--c-accent)" }}>
                              {log.performed_by || "system"}
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
                          Target:{" "}
                          <span style={{ color: "var(--text-primary)" }}>
                            {log.target_user || "System"}
                          </span>
                        </div>
                        {log.details && (
                          <div
                            className="mono"
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginTop: 3,
                              fontStyle: "italic",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                            "{log.details}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: timestamps */}
                    <div
                      style={{
                        textAlign: "right",
                        flexShrink: 0,
                        paddingTop: 2,
                      }}>
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                          fontWeight: 500,
                        }}>
                        {formatTime(log.timestamp)}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}>
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
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