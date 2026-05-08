import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LogsPage from './pages/LogsPage';
import AlertsPage from './pages/AlertsPage';

function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'customer' ? '/dashboard' : '/admin'} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'customer' ? '/dashboard' : '/admin'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><RegisterPage /></PublicRoute>
      } />

      {/* Customer */}
      <Route path="/dashboard" element={
        <PrivateRoute allowedRoles={['customer']}><DashboardPage /></PrivateRoute>
      } />

      {/* Admin / Analyst */}
      <Route path="/admin" element={
        <PrivateRoute allowedRoles={['admin', 'analyst']}><AdminDashboardPage /></PrivateRoute>
      } />
      <Route path="/admin/logs" element={
        <PrivateRoute allowedRoles={['admin', 'analyst']}><LogsPage /></PrivateRoute>
      } />
      <Route path="/admin/alerts" element={
        <PrivateRoute allowedRoles={['admin', 'analyst']}><AlertsPage /></PrivateRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
