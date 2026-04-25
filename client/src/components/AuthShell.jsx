export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <p className="auth-kicker">Smart Campus Operations Hub</p>
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
