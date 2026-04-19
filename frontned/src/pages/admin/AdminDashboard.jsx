import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Spinner, EmptyState, Badge, StatCard, SectionHeader } from '../../components/ui/index';
import { 
  FiCheck, FiX, FiRefreshCw, FiUserPlus, FiUserCheck, FiUserX, 
  FiShield, FiAward, FiLogIn, FiUser, FiFilter, FiTrendingUp 
} from 'react-icons/fi';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    users: { total: 0, pending: 0, approved: 0, rejected: 0 },
    roles: { admins: 0, issuers: 0, holders: 0, verifiers: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionState, setActionState] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    role: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('tiv_user'));
    } catch {
      return null;
    }
  }, []);

  const currentUserId = currentUser?.public_id;

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.role) params.role = filters.role;
      
      const res = await api.get('/admin/users', { params });
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/admin/logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchLogs()
      ]);
    };
    loadInitialData();
  }, [fetchStats, fetchUsers, fetchLogs]);

  // Approve user
  const approve = async (publicId) => {
    setActionState({ id: publicId, type: 'approve' });

    try {
      await api.post(`/admin/approve/${publicId}`);
      toast.success('User approved');

      setUsers(prev =>
        prev.map(u =>
          u.public_id === publicId ? { ...u, status: 'approved' } : u
        )
      );

      await Promise.all([
        fetchStats(),
        (async () => {
          const logsRes = await api.get('/admin/logs');
          setLogs(logsRes.data);
        })()
      ]);

    } catch (e) {
      toast.error(e.response?.data?.detail || 'Approval failed');
    } finally {
      setActionState(null);
    }
  };

  // Reject user
  const reject = async (publicId) => {
    setActionState({ id: publicId, type: 'reject' });

    try {
      await api.post(`/admin/reject/${publicId}`);
      toast.success('User rejected');

      setUsers(prev =>
        prev.map(u =>
          u.public_id === publicId ? { ...u, status: 'rejected' } : u
        )
      );

      await Promise.all([
        fetchStats(),
        (async () => {
          const logsRes = await api.get('/admin/logs');
          setLogs(logsRes.data);
        })()
      ]);

    } catch (e) {
      toast.error(e.response?.data?.detail || 'Reject failed');
    } finally {
      setActionState(null);
    }
  };

  // Reset to pending (for rejected or approved users)
  const resetToPending = async (publicId) => {
    setActionState({ id: publicId, type: 'reset' });

    try {
      await api.post(`/admin/unapprove/${publicId}`);
      toast.success('User reset to pending');

      setUsers(prev =>
        prev.map(u =>
          u.public_id === publicId ? { ...u, status: 'pending' } : u
        )
      );

      await Promise.all([
        fetchStats(),
        (async () => {
          const logsRes = await api.get('/admin/logs');
          setLogs(logsRes.data);
        })()
      ]);

    } catch (e) {
      toast.error(e.response?.data?.detail || 'Reset failed');
    } finally {
      setActionState(null);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({ status: '', role: '' });
    setShowFilters(false);
  };

  // Get log icon and color
  const getLogDetails = useCallback((action) => {
    const logMap = {
      'USER_APPROVED': { icon: <FiUserCheck size={14} />, color: '#00ff88', label: 'User Approved' },
      'USER_REJECTED': { icon: <FiUserX size={14} />, color: '#ff5555', label: 'User Rejected' },
      'USER_UNAPPROVED': { icon: <FiRefreshCw size={14} />, color: '#f59e0b', label: 'User Reset to Pending' },
      'USER_REGISTERED': { icon: <FiUserPlus size={14} />, color: '#00d4ff', label: 'User Registered' },
      'ISSUER_ADDED': { icon: <FiAward size={14} />, color: '#ff00ff', label: 'Issuer Added' },
      'VERIFIER_ADDED': { icon: <FiShield size={14} />, color: '#f59e0b', label: 'Verifier Added' },
      'HOLDER_ADDED': { icon: <FiUser size={14} />, color: '#00ff88', label: 'Holder Added' },
    };
    return logMap[action] || { icon: <FiLogIn size={14} />, color: '#888', label: action.replace(/_/g, ' ') };
  }, []);

  // Format timestamp
  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }, []);

  const ROLE_COLOR = {
    admin: '#ff00ff',
    issuer: '#00d4ff',
    holder: '#00ff88',
    verifier: '#f59e0b'
  };

  const STATUS_COLOR = {
    approved: '#00ff88',
    pending: '#f59e0b',
    rejected: '#ff5555'
  };

  // Mobile responsive table component
  const MobileUserCard = ({ user, roleColor, statusColor, isCurrentUser }) => (
    <div className="glass rounded-xl p-4 mb-3 border border-white/5">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="text-xs text-cyan-400 font-mono font-medium mb-1">
            {user.public_id}
          </div>
          <div className="text-xs text-slate-300 font-mono">
            {user.email}
          </div>
        </div>
        <Badge variant={user.status === 'approved' ? 'success' : user.status === 'rejected' ? 'error' : 'warning'}>
          {user.status}
        </Badge>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <span className="px-2 py-1 rounded text-xs font-mono font-medium"
          style={{
            background: `${roleColor}15`,
            color: roleColor,
            border: `1px solid ${roleColor}33`
          }}>
          {user.role.toUpperCase()}
        </span>
      </div>

      {!isCurrentUser && (
        <div className="flex flex-wrap gap-2 mt-2">
          {user.status === 'pending' && (
            <>
              <button
                onClick={() => approve(user.public_id)}
                disabled={actionState?.id === user.public_id}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all hover:scale-105"
                style={{
                  background: '#00ff8815',
                  color: '#00ff88',
                  border: '1px solid #00ff8833'
                }}
              >
                {actionState?.id === user.public_id && actionState?.type === 'approve'
                  ? <Spinner size={12} />
                  : <FiCheck size={12} />}
                Approve
              </button>

              <button
                onClick={() => reject(user.public_id)}
                disabled={actionState?.id === user.public_id}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all hover:scale-105"
                style={{
                  background: '#ff555515',
                  color: '#ff5555',
                  border: '1px solid #ff555533'
                }}
              >
                {actionState?.id === user.public_id && actionState?.type === 'reject'
                  ? <Spinner size={12} />
                  : <FiX size={12} />}
                Reject
              </button>
            </>
          )}

          {(user.status === 'approved' || user.status === 'rejected') && (
            <button
              onClick={() => resetToPending(user.public_id)}
              disabled={actionState?.id === user.public_id}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all hover:scale-105"
              style={{
                background: '#f59e0b15',
                color: '#f59e0b',
                border: '1px solid #f59e0b33'
              }}
            >
              {actionState?.id === user.public_id && actionState?.type === 'reset'
                ? <Spinner size={12} />
                : <FiRefreshCw size={12} />}
              Reset to Pending
            </button>
          )}
        </div>
      )}

      {isCurrentUser && (
        <div className="text-center text-xs text-slate-500 italic mt-2">
          Current user (cannot modify)
        </div>
      )}
    </div>
  );

  // Show loading skeleton for stats
  if (statsLoading && stats.users.total === 0) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
              <div className="h-8 bg-slate-700 rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-8">
          <div className="flex justify-center">
            <Spinner size={40} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-0">
      {/* STATS CARDS - Responsive Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard 
          label="Total Users" 
          value={stats.users.total} 
          icon="👥" 
          color="#00d4ff" 
          loading={statsLoading}
        />
        <StatCard 
          label="Pending" 
          value={stats.users.pending} 
          icon="⏳" 
          color="#f59e0b" 
          loading={statsLoading}
        />
        <StatCard 
          label="Approved" 
          value={stats.users.approved} 
          icon="✅" 
          color="#00ff88" 
          loading={statsLoading}
        />
        <StatCard 
          label="Rejected" 
          value={stats.users.rejected} 
          icon="🚫" 
          color="#ff5555" 
          loading={statsLoading}
        />
      </div>

      {/* Role Distribution Cards - Responsive */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <div className="glass rounded-xl p-2 md:p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-slate-500 font-mono">Admins</span>
            <FiShield size={12} md:size={14} style={{ color: '#ff00ff' }} />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white mt-1">
            {statsLoading ? <span className="animate-pulse">...</span> : stats.roles.admins}
          </p>
        </div>
        <div className="glass rounded-xl p-2 md:p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-slate-500 font-mono">Issuers</span>
            <FiAward size={12} md:size={14} style={{ color: '#00d4ff' }} />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white mt-1">
            {statsLoading ? <span className="animate-pulse">...</span> : stats.roles.issuers}
          </p>
        </div>
        <div className="glass rounded-xl p-2 md:p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-slate-500 font-mono">Holders</span>
            <FiUser size={12} md:size={14} style={{ color: '#00ff88' }} />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white mt-1">
            {statsLoading ? <span className="animate-pulse">...</span> : stats.roles.holders}
          </p>
        </div>
        <div className="glass rounded-xl p-2 md:p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-slate-500 font-mono">Verifiers</span>
            <FiShield size={12} md:size={14} style={{ color: '#f59e0b' }} />
          </div>
          <p className="text-xl md:text-2xl font-bold text-white mt-1">
            {statsLoading ? <span className="animate-pulse">...</span> : stats.roles.verifiers}
          </p>
        </div>
      </div>

      {/* USERS SECTION */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <SectionHeader
          title="User Management"
          subtitle="Manage platform users and access"
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-neon px-2 md:px-3 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-mono flex items-center gap-1 md:gap-2 transition-all hover:scale-105"
              >
                <FiFilter size={12} /> 
                <span className="hidden md:inline">Filters</span>
                <span className="md:hidden">Filter</span>
              </button>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="btn-neon px-2 md:px-3 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-mono flex items-center gap-1 md:gap-2 transition-all hover:scale-105"
              >
                <FiRefreshCw size={12} className={loading ? 'animate-spin' : ''} /> 
                <span className="hidden md:inline">Refresh</span>
              </button>
            </div>
          }
        />

        {/* Filters Panel - Responsive */}
        {showFilters && (
          <div className="px-4 md:px-6 pb-4">
            <div className="glass rounded-xl p-3 md:p-4 border border-white/10">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="flex-1">
                  <label className="text-[10px] md:text-xs font-mono text-slate-500 uppercase tracking-widest">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="input-cyber w-full px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-mono text-xs md:text-sm mt-1"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] md:text-xs font-mono text-slate-500 uppercase tracking-widest">Role</label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    className="input-cyber w-full px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-mono text-xs md:text-sm mt-1"
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="issuer">Issuer</option>
                    <option value="holder">Holder</option>
                    <option value="verifier">Verifier</option>
                  </select>
                </div>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 md:py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white transition-colors mt-6 md:mt-0"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 md:px-6 pb-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={32} />
            </div>
          ) : users.length === 0 ? (
            <EmptyState icon="👥" title="No users found" message="No users match the selected filters." />
          ) : (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Public ID', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                        <th key={h} className="py-3 px-3 text-xs text-slate-500 uppercase font-mono text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const roleColor = ROLE_COLOR[u.role] || '#00d4ff';
                      const isCurrentUser = u.public_id === currentUserId;

                      return (
                        <tr key={u.public_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3">
                            <span className="text-xs text-cyan-400 font-mono font-medium">
                              {u.public_id}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-xs text-slate-300 font-mono">
                              {u.email}
                            </span>
                           </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-1 rounded text-xs font-mono font-medium"
                              style={{
                                background: `${roleColor}15`,
                                color: roleColor,
                                border: `1px solid ${roleColor}33`
                              }}>
                              {u.role.toUpperCase()}
                            </span>
                           </td>
                          <td className="py-3 px-3">
                            <Badge variant={u.status === 'approved' ? 'success' : u.status === 'rejected' ? 'error' : 'warning'}>
                              {u.status}
                            </Badge>
                           </td>
                          <td className="py-3 px-3">
                            {isCurrentUser ? (
                              <span className="text-xs text-slate-500 italic">Current user</span>
                            ) : (
                              <div className="flex gap-2">
                                {u.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => approve(u.public_id)}
                                      disabled={actionState?.id === u.public_id}
                                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                      style={{
                                        background: '#00ff8815',
                                        color: '#00ff88',
                                        border: '1px solid #00ff8833'
                                      }}
                                    >
                                      {actionState?.id === u.public_id && actionState?.type === 'approve'
                                        ? <Spinner size={12} />
                                        : <FiCheck size={12} />}
                                      Approve
                                    </button>

                                    <button
                                      onClick={() => reject(u.public_id)}
                                      disabled={actionState?.id === u.public_id}
                                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                      style={{
                                        background: '#ff555515',
                                        color: '#ff5555',
                                        border: '1px solid #ff555533'
                                      }}
                                    >
                                      {actionState?.id === u.public_id && actionState?.type === 'reject'
                                        ? <Spinner size={12} />
                                        : <FiX size={12} />}
                                      Reject
                                    </button>
                                  </>
                                )}

                                {(u.status === 'approved' || u.status === 'rejected') && (
                                  <button
                                    onClick={() => resetToPending(u.public_id)}
                                    disabled={actionState?.id === u.public_id}
                                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all hover:scale-105"
                                    style={{
                                      background: '#f59e0b15',
                                      color: '#f59e0b',
                                      border: '1px solid #f59e0b33'
                                    }}
                                  >
                                    {actionState?.id === u.public_id && actionState?.type === 'reset'
                                      ? <Spinner size={12} />
                                      : <FiRefreshCw size={12} />}
                                    Reset
                                  </button>
                                )}
                              </div>
                            )}
                           </td>
                         </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Visible only on mobile */}
              <div className="md:hidden">
                {users.map((u) => {
                  const roleColor = ROLE_COLOR[u.role] || '#00d4ff';
                  const isCurrentUser = u.public_id === currentUserId;
                  return (
                    <MobileUserCard 
                      key={u.public_id}
                      user={u}
                      roleColor={roleColor}
                      isCurrentUser={isCurrentUser}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ADMIN LOGS SECTION - Responsive */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <SectionHeader 
          title="Activity Logs" 
          subtitle="System and user actions history"
          action={
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="btn-neon px-2 md:px-3 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-mono flex items-center gap-1 md:gap-2 transition-all hover:scale-105"
            >
              <FiRefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} /> 
              <span className="hidden md:inline">Refresh Logs</span>
            </button>
          }
        />

        <div className="p-4 md:p-6">
          {logsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size={28} />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState icon="📋" title="No logs available" message="No activity recorded yet." />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {logs.map((log, idx) => {
                const { icon, color, label } = getLogDetails(log.action);
                const timeAgo = formatTime(log.timestamp);
                
                return (
                  <div 
                    key={idx} 
                    className="p-3 md:p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5" style={{ color }}>
                          {icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
                            <span className="text-xs md:text-sm font-mono font-medium" style={{ color }}>
                              {label}
                            </span>
                            <span className="hidden md:inline text-xs text-slate-600">•</span>
                            <span className="text-[10px] md:text-xs text-slate-500 font-mono">
                              By: <span className="text-cyan-400">{log.performed_by}</span>
                            </span>
                          </div>
                          
                          <p className="text-[10px] md:text-xs text-slate-400 mb-1 break-all">
                            Target: <span className="text-slate-300 font-mono">{log.target_user || 'System'}</span>
                          </p>
                          
                          {log.details && (
                            <p className="text-[10px] md:text-xs text-slate-500 mt-1 italic break-all">
                              "{log.details}"
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-left md:text-right">
                        <span className="text-[10px] md:text-[11px] text-slate-500 font-mono whitespace-nowrap">
                          {timeAgo}
                        </span>
                        <div className="text-[9px] md:text-[10px] text-slate-600 font-mono mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 212, 255, 0.5);
        }
        
        @media (max-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 3px;
          }
        }
      `}</style>
    </div>
  );
}