import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import api from '../api/client';
import {
  Users, FileText, Bell, ShieldAlert, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, RefreshCw, Activity
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid
} from 'recharts';

function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between">
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</p>
          {loading
            ? <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 8 }} />
            : <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
          }
          {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}28`,
        }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

const severityColor = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6', low: '#6b7280' };

function RecentActivity({ logs }) {
  const actionBadge = (action) => {
    const map = {
      LOGIN_SUCCESS: 'badge-success',
      LOGIN_FAILED: 'badge-warning',
      REGISTER: 'badge-info',
      ACCOUNT_LOCKED: 'badge-critical',
      LOGOUT: 'badge-low',
      DATA_ACCESS: 'badge-info',
    };
    return map[action] || 'badge-low';
  };

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</h2>
      </div>
      {logs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No recent activity</div>
      ) : (
        <div>
          {logs.map((log, i) => (
            <div key={log._id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
              borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: log.success ? '#10b981' : '#ef4444',
                boxShadow: `0 0 6px ${log.success ? '#10b981' : '#ef4444'}`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${actionBadge(log.action)}`}>{log.action}</span>
                  {log.userId?.name && (
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{log.userId.name}</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  {log.ipAddress} · {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`badge badge-${log.severity}`}>{log.severity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0c1427', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState([]);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get('/logs/stats');
      setStats(data.data);
      // Build chart data
      const byDate = {};
      (data.data.charts?.loginsByDay || []).forEach(item => {
        const d = item._id.date;
        if (!byDate[d]) byDate[d] = { date: d, Success: 0, Failed: 0 };
        if (item._id.action === 'LOGIN_SUCCESS') byDate[d].Success = item.count;
        if (item._id.action === 'LOGIN_FAILED') byDate[d].Failed = item.count;
      });
      setChartData(Object.values(byDate).slice(-7));
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const overview = stats?.overview;
  const last24h = stats?.last24h;

  return (
    <AppShell>
      <div className="fade-in">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="pulse-dot" />
              <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>Live monitoring</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>Security Hub</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              STRIDE threat intelligence dashboard
            </p>
          </div>
          <button className="btn-ghost" onClick={() => fetchStats(true)} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Critical alert banner */}
        {overview?.criticalAlerts > 0 && (
          <div style={{
            marginBottom: 24, padding: '14px 20px', borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <ShieldAlert size={18} style={{ color: '#f87171', flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: '#fca5a5' }}>
              <strong>{overview.criticalAlerts}</strong> critical unresolved alert{overview.criticalAlerts !== 1 ? 's' : ''} require your attention.
            </p>
            <button className="btn-danger" style={{ marginLeft: 'auto' }} onClick={() => window.location.href = '/admin/alerts'}>
              View Alerts
            </button>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StatCard icon={Users}       label="Total Users"          value={overview?.totalUsers ?? '—'}    color="#3b82f6" loading={loading} />
          <StatCard icon={FileText}    label="Total Audit Logs"     value={overview?.totalLogs ?? '—'}     color="#8b5cf6" loading={loading} />
          <StatCard icon={Bell}        label="Unresolved Alerts"    value={overview?.unresolvedAlerts ?? '—'} color="#f59e0b" loading={loading} />
          <StatCard icon={ShieldAlert} label="Critical Alerts"      value={overview?.criticalAlerts ?? '—'} color="#ef4444" loading={loading} />
        </div>

        {/* 24h stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div className="glass-card p-5 flex items-center gap-4">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Successful Logins (24h)</p>
              {loading ? <div className="skeleton" style={{ height: 24, width: 50, marginTop: 4 }} />
                : <p style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{last24h?.successfulLogins ?? 0}</p>}
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={20} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Failed Logins (24h)</p>
              {loading ? <div className="skeleton" style={{ height: 24, width: 50, marginTop: 4 }} />
                : <p style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{last24h?.failedLogins ?? 0}</p>}
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Login Success Rate</p>
              {loading ? <div className="skeleton" style={{ height: 24, width: 50, marginTop: 4 }} />
                : <p style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa' }}>{last24h?.loginSuccessRate ?? 100}%</p>}
            </div>
          </div>
        </div>

        {/* Chart + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Line chart */}
          <div className="glass-card p-6">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
              Login Activity (7 days)
            </h2>
            {loading ? (
              <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
            ) : chartData.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                No data yet — start using the app!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Success" stroke="#10b981" fill="url(#colorSuccess)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Failed" stroke="#ef4444" fill="url(#colorFailed)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Alerts by severity */}
          <div className="glass-card p-6">
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
              Alerts by Severity
            </h2>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />)}
              </div>
            ) : !stats?.charts?.alertsBySeverity?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['critical', 'warning', 'info'].map(s => (
                  <div key={s} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                  }}>
                    <span className={`badge badge-${s}`}>{s}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>0</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.charts.alertsBySeverity.map(item => (
                  <div key={item._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                  }}>
                    <span className={`badge badge-${item._id}`}>{item._id}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: severityColor[item._id] ?? 'var(--text-primary)' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <RecentActivity logs={stats?.recentActivity ?? []} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
