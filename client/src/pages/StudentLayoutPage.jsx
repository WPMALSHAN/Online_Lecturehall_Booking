import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard/student', label: 'Student Dashboard' },
  { to: '/dashboard/facilities', label: 'Facilities' },
  { to: '/dashboard/bookings', label: 'Bookings' },
  { to: '/dashboard/incidents', label: 'Incidents' },
  { to: '/dashboard/notifications', label: 'Notifications' },
  { to: '/dashboard/profile', label: 'Profile' },
  { to: '/dashboard/settings', label: 'Settings' },
];

export default function StudentLayoutPage() {
  const { name, role, signOut } = useAuth();

  return (
    <main className="student-shell">
      <aside className="student-sidebar">
        <div className="sidebar-brand">
          <p className="topbar-kicker">Smart Campus</p>
          <h1>Student Portal</h1>
          <p>{name} ({role})</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="danger-btn" onClick={signOut}>
          Sign Out
        </button>
      </aside>

      <section className="student-content">
        <Outlet />
      </section>
    </main>
  );
}
