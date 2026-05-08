import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Lock, Mail, User, AlertTriangle, ChevronDown } from 'lucide-react';

export default function RegisterPage() {
  const { register, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const checkStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    setStrength(s);
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      navigate(user.role === 'customer' ? '/dashboard' : '/admin');
    } catch {}
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 8px 32px rgba(139,92,246,0.35)' }}>
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">CyberBank</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>Create your secure account</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold mb-1">Register</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
            Join the most secure banking platform
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
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-name" className="cb-input" style={{ paddingLeft: 40 }}
                  type="text" placeholder="Jane Doe"
                  value={form.name}
                  onChange={e => { setError(null); setForm(f => ({ ...f, name: e.target.value })); }}
                  required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-email" className="cb-input" style={{ paddingLeft: 40 }}
                  type="email" placeholder="you@example.com"
                  value={form.email}
                  onChange={e => { setError(null); setForm(f => ({ ...f, email: e.target.value })); }}
                  required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-password" className="cb-input" style={{ paddingLeft: 40, paddingRight: 44 }}
                  type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => { setError(null); setForm(f => ({ ...f, password: e.target.value })); checkStrength(e.target.value); }}
                  required minLength={8} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 12, marginTop: 4, color: strengthColor[strength] }}>
                    {strength > 0 && strengthLabel[strength]}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Account Role</label>
              <div style={{ position: 'relative' }}>
                <select id="reg-role" className="cb-input"
                  style={{ appearance: 'none', paddingRight: 40, cursor: 'pointer' }}
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="customer">Customer</option>
                  <option value="analyst">Security Analyst</option>
                  <option value="admin">Administrator</option>
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            <button id="reg-submit" type="submit" className="btn-primary" disabled={loading}
              style={{ marginTop: 4, height: 46 }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } select option { background: #0c1427; }`}</style>
    </div>
  );
}
