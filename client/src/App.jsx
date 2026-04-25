import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import MainLayout from './components/layouts/MainLayout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import FacilitiesPage from './pages/facilities/FacilitiesPage'
import AssetsPage from './pages/assets/AssetsPage'
import BookingPage from './pages/bookings/BookingPage'
import MyBookingsPage from './pages/bookings/MyBookingsPage'
import AdminBookingsPage from './pages/bookings/AdminBookingsPage'
import ReportIncidentPage from './pages/incidents/ReportIncidentPage'
import MyIncidentsPage from './pages/incidents/MyIncidentsPage'
import AllIncidentsPage from './pages/incidents/AllIncidentsPage'
import TechnicianWorkPage from './pages/incidents/TechnicianWorkPage'
import ManageFacilitiesPage from './pages/admin/ManageFacilitiesPage'
import ManageAssetsPage from './pages/admin/ManageAssetsPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ProfilePage from './pages/profile/ProfilePage'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <NotificationProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                },
              },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/facilities" element={<FacilitiesPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/bookings" element={<MyBookingsPage />} />
              <Route path="/bookings/new" element={<BookingPage />} />
              <Route path="/incidents" element={<MyIncidentsPage />} />
              <Route path="/incidents/new" element={<ReportIncidentPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              <Route path="/technician" element={
                <ProtectedRoute roles={['TECHNICIAN', 'ADMIN']}>
                  <TechnicianWorkPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/bookings" element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <AdminBookingsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/incidents" element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <AllIncidentsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/facilities" element={
                <ProtectedRoute roles={['ADMIN']}>
                  <ManageFacilitiesPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/assets" element={
                <ProtectedRoute roles={['ADMIN']}>
                  <ManageAssetsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute roles={['ADMIN']}>
                  <UserManagementPage />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
