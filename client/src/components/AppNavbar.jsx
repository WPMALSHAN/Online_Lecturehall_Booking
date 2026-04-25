import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppNavbar({ unreadCount = 0 }) {
  const navigate = useNavigate();
  const { name, role, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-2 text-blue-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            SC
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-500">Smart Campus</p>
            <p className="text-sm font-semibold">Management Portal</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-blue-700 hover:bg-blue-50'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `relative rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-blue-700 hover:bg-blue-50'
              }`
            }
          >
            Notifications
            {unreadCount > 0 ? (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-blue-900">{name}</p>
            <p className="text-xs font-medium uppercase text-blue-500">{role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
