import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
  const { role } = useAuth();

  if (role === 'ADMIN') {
    return <Navigate to="/dashboard/bookings/admin" replace />;
  }

  return <Navigate to="/dashboard/bookings/my" replace />;
}
