import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const moduleCards = [
  {
    title: 'Incident Ticketing',
    description:
      'Create incidents, attach images, track status updates, and collaborate with comments.',
    path: '/dashboard/incidents',
  },
  {
    title: 'Booking Management',
    description:
      'Booking page placeholder is available through the student navigation.',
    path: '/dashboard/bookings',
  },
  {
    title: 'Notifications',
    description:
      'Notification page placeholder is available through the student navigation.',
    path: '/dashboard/notifications',
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <p className="landing-badge">IT3030 | PAF Assignment 2026</p>
        <h1>Smart Campus Operations Hub</h1>
        <p className="landing-lead">
          One platform for facilities, bookings, incidents, and notifications built for your full
          assignment workflow.
        </p>

        <div className="landing-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard/student" className="btn-link primary">
                Open Dashboard
              </Link>
              <Link to="/dashboard/incidents" className="btn-link ghost">
                Open Navigation
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-link primary">
                Login
              </Link>
              <Link to="/register" className="btn-link ghost">
                Register
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="module-grid">
        {moduleCards.map((card) => (
          <article key={card.title} className="module-card">
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <Link to={card.path}>Open Module</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
