/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Spaces from './pages/Spaces';
import Members from './pages/Members';
import Memberships from './pages/Memberships';
import Billing from './pages/Billing';
import Portal from './pages/Portal';
import Admins from './pages/Admins';
import SuperUserLayout from './layouts/SuperUserLayout';
import Tenants from './pages/Tenants';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, tenantSlug } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'superuser') {
      return <Navigate to="/superuser/tenants" replace />;
    }
    return <Navigate to={`/t/${tenantSlug || 'tenant'}/portal`} replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/superuser" element={
          <ProtectedRoute allowedRoles={['superuser']}>
            <SuperUserLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="tenants" replace />} />
          <Route path="tenants" element={<Tenants />} />
        </Route>

        <Route path="/t/:tenantSlug" element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          
          {/* Admin/Owner Routes */}
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="reservas" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Reservations />
            </ProtectedRoute>
          } />
          <Route path="espacios" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Spaces />
            </ProtectedRoute>
          } />
          <Route path="miembros" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Members />
            </ProtectedRoute>
          } />
          <Route path="membresias" element={
            <ProtectedRoute allowedRoles={['owner']}>
              <Memberships />
            </ProtectedRoute>
          } />
          <Route path="facturacion" element={
            <ProtectedRoute allowedRoles={['owner', 'admin']}>
              <Billing />
            </ProtectedRoute>
          } />
          <Route path="admins" element={
            <ProtectedRoute allowedRoles={['owner']}>
              <Admins />
            </ProtectedRoute>
          } />
          
          {/* Member Route */}
          <Route path="portal" element={
            <ProtectedRoute allowedRoles={['member', 'owner', 'admin']}>
              <Portal />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}
