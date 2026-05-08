import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle2, RefreshCw, ShieldAlert, ChevronLeft, ChevronRight, BellOff } from 'lucide-react';

function AlertCard({ alert, onResolve, isAdmin }) {
  const [resolving, setResolving] = useState(false);

  const severityStyles = {
    critical: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', dot: '#ef4444' },
    warning:  { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
    info:     { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)', dot: '#3b82f6' },
    low:      { bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.15)', dot: '#6b7280' },
  }[alert.severity] ?? { bg: 'rgba(255,255,255,0.02)', border: 'var(--border)', dot: '#6b7280' };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await api.patch(`/logs/alerts/${alert._id}/resolve`);
      onResolve(alert._id);
    } catch (e) { console.error(e); }
    finally { setResolving(false); }
  };

  return (
    <div style={{
      background: alert.resolved ? 'rgba(255,255,255,0.01)' : severityStyles.bg,
      border: `1px solid ${alert.resolved ? 'var(--border)' : severityStyles.border}`,
      borderRadius: 14, padding: '16px 20px',
      opacity: alert.resolved ? 0.6 : 1,
      transition: 'all 0.2s',
    }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3" style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: alert.resolved ? '#10b981' : severityStyles.dot,
            marginTop: 5,
            boxShadow: alert.resolved ? 'none' : `0 0 8px ${severityStyles.dot}`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{alert.type}</span>
              {alert.resolved && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981' }}>
                  <CheckCircle2 size={11} /> Resolved
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>
              {alert.message}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              {alert.userId?.name && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👤 {alert.userId.name}</span>
              )}
              {alert.ipAddress && (
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>📡 {alert.ipAddress}</span>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                🕐 {new Date(alert.createdAt).toLocaleString()}
              </span>
            </div>
            {alert.resolved && alert.resolvedAt && (
              <p style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>
                Resolved at {new Date(alert.resolvedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        {isAdmin && !alert.resolved && (
          <button className="btn-ghost" style={{ flexShrink: 0, padding: '7px 14px', fontSize: 12 }}
            onClick={handleResolve} disabled={resolving}>
            {resolving ? (
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            ) : <><CheckCircle2 size={13} /> Resolve</>}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ resolved: '', severity: '', page: 1 });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 15, page: filter.page });
      if (filter.severity) params.set('severity', filter.severity);
      if (filter.resolved !== '') params.set('resolved', filter.resolved);
      const { data } = await api.get('/logs/alerts?' + params);
      setAlerts(data.data.alerts);
      setPagination(data.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleResolve = (id) => {
    setAlerts(prev => prev.map(a => a._id === id ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a));
  };

  return (
    <AppShell>
      <div className="fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Security Alerts</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              {pagination.total} alert{pagination.total !== 1 ? 's' : ''} — STRIDE threat detection
            </p>
          </div>
          <button className="btn-ghost" onClick={fetchAlerts} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select className="cb-input" style={{ width: 'auto', cursor: 'pointer', appearance: 'none', paddingRight: 16 }}
            value={filter.resolved}
            onChange={e => setFilter(f => ({ ...f, resolved: e.target.value, page: 1 }))}>
            <option value="">All Alerts</option>
            <option value="false">Unresolved</option>
            <option value="true">Resolved</option>
          </select>
          <select className="cb-input" style={{ width: 'auto', cursor: 'pointer', appearance: 'none', paddingRight: 16 }}
            value={filter.severity}
            onChange={e => setFilter(f => ({ ...f, severity: e.target.value, page: 1 }))}>
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Alert list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <BellOff size={40} style={{ color: 'var(--text-muted)', display: 'block', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No alerts found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map(alert => (
              <AlertCard key={alert._id} alert={alert} onResolve={handleResolve} isAdmin={isAdmin} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Page {pagination.page} of {pagination.pages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ padding: '8px 14px' }}
                disabled={pagination.page <= 1}
                onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft size={16} />
              </button>
              <button className="btn-ghost" style={{ padding: '8px 14px' }}
                disabled={pagination.page >= pagination.pages}
                onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } select option { background: #0c1427; }`}</style>
    </AppShell>
  );
}
