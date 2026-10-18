import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuth2CallbackPage from './pages/OAuth2CallbackPage';

// Patient Pages
import PatientDashboard from './pages/PatientDashboard';
import DoctorSearchPage from './pages/DoctorSearchPage';
import DoctorDetailPage from './pages/DoctorDetailPage';
import PatientAppointmentsPage from './pages/PatientAppointmentsPage';
import PatientPrescriptionsPage from './pages/PatientPrescriptionsPage';
import PatientProfilePage from './pages/PatientProfilePage';

// Doctor & Admin Pages
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAvailabilityPage from './pages/DoctorAvailabilityPage';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import DoctorPrescriptionsPage from './pages/DoctorPrescriptionsPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminDoctorManagementPage from './pages/AdminDoctorManagementPage';
import AdminPatientManagementPage from './pages/AdminPatientManagementPage';
import AdminAppointmentManagementPage from './pages/AdminAppointmentManagementPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Main Site */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />} />
        </Route>

        {/* Authentication Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
        </Route>

        {/* Patient Experience Routes */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="doctors" element={<DoctorSearchPage />} />
          <Route path="doctors/:id" element={<DoctorDetailPage />} />
          <Route path="appointments" element={<PatientAppointmentsPage />} />
          <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
          <Route path="profile" element={<PatientProfilePage />} />
        </Route>

        {/* Doctor Dashboard Routes */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="availability" element={<DoctorAvailabilityPage />} />
          <Route path="appointments" element={<DoctorAppointmentsPage />} />
          <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
          <Route path="profile" element={<DoctorProfilePage />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="doctors" element={<AdminDoctorManagementPage />} />
          <Route path="patients" element={<AdminPatientManagementPage />} />
          <Route path="appointments" element={<AdminAppointmentManagementPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
