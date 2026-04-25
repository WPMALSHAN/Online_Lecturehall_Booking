import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const modules = [
  {
    title: 'Incident Ticketing',
    description: 'Create tickets, assign technicians, manage comments, and control status flow.',
    path: '/dashboard/incidents',
  },
  {
    title: 'Booking Management',
    description: 'Track resource booking requests and approval pipeline.',
    path: '/dashboard',
  },
  {
    title: 'Notifications',
    description: 'View important workflow updates from all modules.',
    path: '/dashboard',
  },
];

export default function DashboardPage() {
  const { isAuthenticated, name, role, signOut } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="module-dashboard">
      <section className="dashboard-hero">
        <p className="topbar-kicker">Operations Workspace</p>
        <h1>Welcome, {name}</h1>
        <p>
          Logged in as <strong>{role}</strong>
        </p>
        <div className="landing-actions">
          <Link to="/dashboard/incidents" className="btn-link primary">
            Open Incident Module
          </Link>
          <Link to="/" className="btn-link ghost">
            Home
          </Link>
          <button type="button" className="danger-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </section>

      <section className="module-grid">
        {modules.map((item) => (
          <article key={item.title} className="module-card">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <Link to={item.path}>Open Module</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
