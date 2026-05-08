import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import {
  CreditCard, TrendingUp, Shield, Clock,
  ArrowUpRight, ArrowDownLeft, Lock, CheckCircle2, AlertCircle
} from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: 1, type: 'credit', label: 'Salary Deposit', amount: 5400, date: '2026-05-01', status: 'completed' },
  { id: 2, type: 'debit',  label: 'Netflix Subscription', amount: 15.99, date: '2026-04-30', status: 'completed' },
  { id: 3, type: 'debit',  label: 'Amazon Purchase', amount: 87.45, date: '2026-04-29', status: 'completed' },
  { id: 4, type: 'credit', label: 'Freelance Payment', amount: 1200, date: '2026-04-28', status: 'completed' },
  { id: 5, type: 'debit',  label: 'Electricity Bill', amount: 124, date: '2026-04-27', status: 'completed' },
];

function StatCard({ icon: Icon, label, value, sub, color, glow }) {
  return (
    <div className="glass-card p-6" style={{ glow }}>
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const balance = user?.balance ?? 12843.50;
  const accountNumber = user?.accountNumber ?? 'CB••••••4321';

  return (
    <AppShell>
      <div className={loaded ? 'fade-in' : ''}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="pulse-dot" />
            <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>All systems normal</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Good evening, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Here's your account overview</p>
        </div>

        {/* Balance card (full width hero) */}
        <div style={{
          borderRadius: 20, padding: '32px 32px', marginBottom: 24,
          background: 'linear-gradient(135deg, #1a2744 0%, #0f1f3d 60%, #1a1440 100%)',
          border: '1px solid rgba(99,179,237,0.18)',
          boxShadow: '0 8px 40px rgba(59,130,246,0.12)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', pointerEvents: 'none' }} />

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Total Balance</p>
              <p style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <CreditCard size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="mono" style={{ fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                  {accountNumber}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>Account Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Lock size={12} style={{ color: '#60a5fa' }} />
                <span style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600 }}>2FA Secured</span>
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-3 mt-6">
            <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
              <ArrowUpRight size={15} /> Send Money
            </button>
            <button className="btn-ghost" style={{ padding: '10px 20px', fontSize: 13 }}>
              <ArrowDownLeft size={15} /> Request
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard icon={TrendingUp}  label="Monthly Income"    value="$6,600"  sub="+12% vs last month"  color="#10b981" />
          <StatCard icon={CreditCard}  label="Monthly Spending"  value="$2,890"  sub="Tracked expenses"     color="#f59e0b" />
          <StatCard icon={Shield}      label="Security Score"    value="98 / 100" sub="Excellent protection" color="#8b5cf6" />
          <StatCard icon={Clock}       label="Last Login"        value={user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Today'} sub="Verified device" color="#3b82f6" />
        </div>

        {/* Transactions */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Transactions</h2>
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>View all</button>
          </div>
          <div>
            {MOCK_TRANSACTIONS.map((tx, i) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px',
                borderBottom: i < MOCK_TRANSACTIONS.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: tx.type === 'credit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {tx.type === 'credit'
                    ? <ArrowDownLeft size={18} style={{ color: '#10b981' }} />
                    : <ArrowUpRight size={18} style={{ color: '#ef4444' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>{tx.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{tx.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: tx.type === 'credit' ? '#10b981' : '#ef4444' }}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <CheckCircle2 size={11} style={{ color: '#34d399' }} />
                    <span style={{ fontSize: 11, color: '#34d399' }}>Completed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security notice */}
        <div style={{
          marginTop: 20, padding: '14px 20px', borderRadius: 12,
          background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertCircle size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Your account is protected by STRIDE-based threat detection. Last security scan: <strong style={{ color: 'var(--text-primary)' }}>2 minutes ago</strong>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
