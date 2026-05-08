import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, LayoutDashboard, FileText, Bell, LogOut,
  User, ChevronRight, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const customerNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
];

const adminNav = [
  { id: 'admin', label: 'Security Hub', icon: LayoutDashboard, href: '/admin' },
  { id: 'logs', label: 'Audit Logs', icon: FileText, href: '/admin/logs' },
  { id: 'alerts', label: 'Alerts', icon: Bell, href: '/admin/alerts' },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user?.role === 'customer' ? customerNav : adminNav;
  const isActive = (href) => location.pathname === href;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleColor = {
    admin: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
    analyst: { bg: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: 'rgba(6,182,212,0.25)' },
    customer: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  }[user?.role] || {};

  const Sidebar = () => (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}>
            <Shield size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.2 }}>CyberBank</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 6px 8px' }}>
          Navigation
        </div>
        {navItems.map(item => (
          <button key={item.id}
            className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            onClick={() => { navigate(item.href); setSidebarOpen(false); }}>
            <item.icon size={17} />
            <span>{item.label}</span>
            {isActive(item.href) && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '10px 12px', marginBottom: 8,
        }}>
          <div className="flex items-center gap-2.5">
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={16} color="white" />
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{
                display: 'inline-block', marginTop: 2, padding: '1px 8px',
                borderRadius: 99, fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                background: roleColor.bg, color: roleColor.color, border: `1px solid ${roleColor.border}`,
              }}>
                {user?.role}
              </div>
            </div>
          </div>
        </div>
        <button className="nav-link w-full" onClick={handleLogout} style={{ color: '#f87171' }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Shield size={20} style={{ color: 'var(--accent-blue)' }} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>CyberBank</span>
        </div>

        <div style={{ flex: 1, padding: '28px 28px', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
