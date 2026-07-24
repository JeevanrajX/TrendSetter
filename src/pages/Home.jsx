import { Link } from 'react-router-dom'

const FEATURES = [
  {
    title: 'AI-Powered Routing',
    description:
      "Every complaint is read and routed to the right department automatically — no guessing which office to call.",
  },
  {
    title: 'Duplicate Detection',
    description:
      'Nearby reports of the same issue are flagged, so citizens can upvote instead of filing a copy.',
  },
  {
    title: 'Live Status Tracking',
    description:
      'Every complaint moves through Pending, Assigned, In Progress, and Resolved — visible to the citizen throughout.',
  },
  {
    title: 'Built-In Accountability',
    description:
      'Resolution photos and auto-escalation keep complaints from stalling without anyone noticing.',
  },
]

export default function Home() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Smart Civic Connect</p>
        <h1>Report civic issues. Watch them get fixed.</h1>
        <p className="hero-sub">
          Potholes, garbage, water leaks, broken streetlights — report them with a photo
          and location, and track every step until it's resolved.
        </p>
        <div className="hero-actions">
          <Link to="/submit" className="btn btn-primary">
            Submit Complaint
          </Link>
          <Link to="/track" className="btn btn-secondary">
            Track Complaint
          </Link>
        </div>
      </section>

      <section className="about">
        <h2>What this is</h2>
        <p>
          Smart Civic Connect gives citizens a direct, structured way to report civic
          issues instead of losing them in calls or informal channels. An AI classifier
          routes each report to the right department, duplicate reports get consolidated
          instead of ignored, and every complaint stays visible from submission to
          resolution.
        </p>
      </section>

      <section className="features">
        <h2>How it works</h2>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="brand">
            <span className="brand-mark">SC</span>
            <span className="brand-name">Smart Civic Connect</span>
          </div>
          <nav className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/submit">Submit Complaint</Link>
            <Link to="/track">Track Complaint</Link>
          </nav>
          <p className="footer-note">Built to close the loop between citizens and departments.</p>
        </div>
      </footer>
    </main>
  )
}
