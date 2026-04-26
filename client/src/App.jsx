import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import NotificationsPage from './pages/NotificationsPage'
import IncidentPage from './pages/IncidentPage'
import ModulePlaceholderPage from './pages/ModulePlaceholderPage'
import RegisterPage from './pages/RegisterPage'
import BookingPage from './pages/BookingPage'
import FacilitiesPage from './pages/FacilitiesPage'
import AssetsPage from './pages/AssetsPage'
import BookFacilityPage from './pages/BookFacilityPage'
import MyBookingsPage from './pages/MyBookingsPage'
import AdminBookingsPage from './pages/AdminBookingsPage'
import ReportIncidentPage from './pages/ReportIncidentPage'
import MyIncidentsPage from './pages/MyIncidentsPage'
import AdminIncidentsPage from './pages/AdminIncidentsPage'
import TechnicianPage from './pages/TechnicianPage'
import AdminFacilitiesPage from './pages/AdminFacilitiesPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminTechnicianFeedbackPage from './pages/AdminTechnicianFeedbackPage'
import './App.css'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard/bookings" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
      <Route path="/dashboard/bookings/book" element={<ProtectedRoute><BookFacilityPage /></ProtectedRoute>} />
      <Route path="/dashboard/bookings/my" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
      <Route path="/dashboard/bookings/admin" element={<ProtectedRoute><AdminBookingsPage /></ProtectedRoute>} />
      <Route path="/dashboard/incidents" element={<ProtectedRoute><IncidentPage /></ProtectedRoute>} />
      <Route path="/dashboard/incidents/report" element={<ProtectedRoute><ReportIncidentPage /></ProtectedRoute>} />
      <Route path="/dashboard/incidents/my" element={<ProtectedRoute><MyIncidentsPage /></ProtectedRoute>} />
      <Route path="/dashboard/incidents/admin" element={<ProtectedRoute><AdminIncidentsPage /></ProtectedRoute>} />
      <Route path="/dashboard/incidents/technician" element={<ProtectedRoute><TechnicianPage /></ProtectedRoute>} />
      <Route path="/dashboard/facilities" element={<ProtectedRoute><FacilitiesPage /></ProtectedRoute>} />
      <Route path="/dashboard/facilities/admin" element={<ProtectedRoute><AdminFacilitiesPage /></ProtectedRoute>} />
      <Route path="/dashboard/users/admin" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
      <Route path="/dashboard/feedback/admin" element={<ProtectedRoute><AdminTechnicianFeedbackPage /></ProtectedRoute>} />
      <Route path="/dashboard/assets" element={<ProtectedRoute><AssetsPage /></ProtectedRoute>} />
      <Route path="/dashboard/profile" element={<ProtectedRoute><ModulePlaceholderPage title="Profile" /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><ModulePlaceholderPage title="Settings" /></ProtectedRoute>} />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />}
      />
    </Routes>
  )
}

export default App
