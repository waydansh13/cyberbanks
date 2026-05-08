import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'customer' ? '/dashboard' : '/admin');
    } catch {}
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 32px rgba(59,130,246,0.35)' }}>
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">CyberBank</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
            Secure. Compliant. STRIDE-Protected.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 glow-blue">
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Sign in</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
            Access your secure banking dashboard
          </p>

          {error && (
            <div className="flex items-start gap-3 p-3 rounded-xl mb-5"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={16} style={{ color: '#f87171', marginTop: 2, flexShrink: 0 }} />
              <span style={{ color: '#fca5a5', fontSize: 13 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-email"
                  className="cb-input"
                  style={{ paddingLeft: 40 }}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => { setError(null); setForm(f => ({ ...f, email: e.target.value })); }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  className="cb-input"
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { setError(null); setForm(f => ({ ...f, password: e.target.value })); }}
                  required
                  autoComplete="current-password"
                />
                <button type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" className="btn-primary w-full" disabled={loading}
              style={{ marginTop: 4, height: 46 }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Authenticating…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>Create one</Link>
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-6 mt-6" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          <span className="flex items-center gap-1.5"><Shield size={12} /> 256-bit Encryption</span>
          <span className="flex items-center gap-1.5"><Lock size={12} /> STRIDE Compliant</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
