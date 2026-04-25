import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import IncidentPage from './pages/IncidentPage'
import ModulePlaceholderPage from './pages/ModulePlaceholderPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import StudentLayoutPage from './pages/StudentLayoutPage'
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
            <StudentLayoutPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/student" replace />} />
        <Route path="student" element={<StudentDashboardPage />} />
        <Route path="facilities" element={<ModulePlaceholderPage title="Facilities" />} />
        <Route path="bookings" element={<ModulePlaceholderPage title="Bookings" />} />
        <Route path="incidents" element={<IncidentPage />} />
        <Route
          path="notifications"
          element={<ModulePlaceholderPage title="Notifications" />}
        />
        <Route path="profile" element={<ModulePlaceholderPage title="Profile" />} />
        <Route path="settings" element={<ModulePlaceholderPage title="Settings" />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />}
      />
    </Routes>
  )
}

export default App
