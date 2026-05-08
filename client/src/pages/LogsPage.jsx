import { useEffect, useState, useCallback } from 'react';
import AppShell from '../components/AppShell';
import api from '../api/client';
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';

const ACTION_OPTIONS = ['', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'REGISTER', 'LOGOUT', 'ACCOUNT_LOCKED', 'DATA_ACCESS'];
const SEVERITY_OPTIONS = ['', 'info', 'warning', 'critical', 'low'];

function LogRow({ log }) {
  const actionClass = {
    LOGIN_SUCCESS: 'badge-success', LOGIN_FAILED: 'badge-warning',
    REGISTER: 'badge-info', ACCOUNT_LOCKED: 'badge-critical',
    LOGOUT: 'badge-low', DATA_ACCESS: 'badge-info',
  }[log.action] ?? 'badge-low';

  return (
    <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(log.createdAt).toLocaleString()}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span className={`badge ${actionClass}`}>{log.action}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {log.userId?.name ?? log.email ?? '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{log.ipAddress ?? '—'}</span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span className={`badge badge-${log.severity}`}>{log.severity}</span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ fontSize: 12, color: log.success ? '#10b981' : '#f87171', fontWeight: 500 }}>
          {log.success ? '✓ Success' : '✗ Failed'}
        </span>
      </td>
    </tr>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', severity: '', page: 1 });
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20, page: filters.page });
      if (filters.action) params.set('action', filters.action);
      if (filters.severity) params.set('severity', filters.severity);
      const { data } = await api.get('/logs?' + params);
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = search
    ? logs.filter(l =>
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.ipAddress?.includes(search))
    : logs;

  return (
    <AppShell>
      <div className="fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Audit Logs</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              {pagination.total.toLocaleString()} total events recorded
            </p>
          </div>
          <button className="btn-ghost" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="cb-input" style={{ paddingLeft: 36 }} placeholder="Search by action, user, IP…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select className="cb-input" style={{ paddingLeft: 30, width: 'auto', cursor: 'pointer', appearance: 'none', paddingRight: 28 }}
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))}>
              {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a || 'All Actions'}</option>)}
            </select>
          </div>
          <select className="cb-input" style={{ width: 'auto', cursor: 'pointer', appearance: 'none', paddingRight: 16 }}
            value={filters.severity}
            onChange={e => setFilters(f => ({ ...f, severity: e.target.value, page: 1 }))}>
            {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Severities'}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Timestamp', 'Action', 'User', 'IP Address', 'Severity', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} style={{ padding: '12px 16px' }}>
                          <div className="skeleton" style={{ height: 20, borderRadius: 6, width: j === 1 ? 130 : j === 3 ? 100 : 70 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 60, textAlign: 'center' }}>
                      <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No logs found</p>
                    </td>
                  </tr>
                ) : filteredLogs.map(log => <LogRow key={log._id} log={log} />)}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" style={{ padding: '6px 12px' }}
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                  <ChevronLeft size={16} />
                </button>
                <button className="btn-ghost" style={{ padding: '6px 12px' }}
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } select option { background: #0c1427; }`}</style>
    </AppShell>
  );
}
