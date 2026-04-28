import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import IssuerDashboard from './pages/issuer/IssuerDashboard';
import HolderDashboard from './pages/holder/HolderDashboard';
import VerifierDashboard from './pages/verifier/VerifierDashboard';

import DashboardLayout from './components/layout/DashboardLayout';


function HomeRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toLowerCase();

  const routes = {
    admin: "/admin",
    issuer: "/issuer",
    holder: "/holder",
    verifier: "/verifier",
  };

  return <Navigate to={routes[role] || "/login"} replace />;
}


function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const userRole = user.role?.toLowerCase();

  if (role && userRole !== role) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return children;
}


function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user && user.role) {
    return <Navigate to="/" replace />;
  }

  return children;
}


function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      <Route path="/" element={<HomeRedirect />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout role="admin">
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/issuer"
        element={
          <ProtectedRoute role="issuer">
            <DashboardLayout role="issuer">
              <IssuerDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/holder"
        element={
          <ProtectedRoute role="holder">
            <DashboardLayout role="holder">
              <HolderDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/verifier"
        element={
          <ProtectedRoute role="verifier">
            <DashboardLayout role="verifier">
              <VerifierDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}