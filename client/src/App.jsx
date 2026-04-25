import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NotificationsPage from './pages/NotificationsPage'
import IncidentPage from './pages/IncidentPage'
import ModulePlaceholderPage from './pages/ModulePlaceholderPage'
import RegisterPage from './pages/RegisterPage'
import BookingPage from './pages/BookingPage'
import './App.css'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
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
      <Route path="/dashboard/incidents" element={<ProtectedRoute><IncidentPage /></ProtectedRoute>} />
      <Route path="/dashboard/facilities" element={<ProtectedRoute><ModulePlaceholderPage title="Facilities" /></ProtectedRoute>} />
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
