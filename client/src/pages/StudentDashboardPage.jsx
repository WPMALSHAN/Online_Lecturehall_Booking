const quickStats = [
  { title: 'My Active Bookings', value: '04' },
  { title: 'Pending Requests', value: '02' },
  { title: 'Open Incident Tickets', value: '01' },
  { title: 'Unread Notifications', value: '06' },
];

const recentActivities = [
  'Booking request submitted for Lecture Hall A2',
  'Incident status changed: Projector issue -> IN_PROGRESS',
  'Admin approved your lab booking for Friday 9.00 AM',
  'New comment added to your incident ticket #21',
];

export default function StudentDashboardPage() {
  return (
    <section className="student-dashboard-page">
      <header className="student-dashboard-header">
        <p className="topbar-kicker">Student Dashboard</p>
        <h2>Campus Activity Overview</h2>
        <p>
          Track your bookings, incidents, and notifications from one clean dashboard.
        </p>
      </header>

      <section className="student-stats-grid">
        {quickStats.map((item) => (
          <article key={item.title} className="student-stat-card">
            <p>{item.title}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="student-panels-grid">
        <article className="student-panel">
          <h3>Today At A Glance</h3>
          <ul>
            <li>08:30 AM - Booking: Engineering Lab 3</li>
            <li>11:00 AM - Meeting Room C1 availability starts</li>
            <li>02:00 PM - Expected update from technician</li>
            <li>04:30 PM - Notification summary refresh</li>
          </ul>
        </article>

        <article className="student-panel">
          <h3>Recent Activity</h3>
          <ul>
            {recentActivities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  );
}
