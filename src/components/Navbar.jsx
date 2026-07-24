import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) => (isActive ? 'active' : '')

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">SC</span>
          <span className="brand-name">Smart Civic Connect</span>
        </Link>

        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/submit" className={linkClass} onClick={() => setOpen(false)}>
            Submit Complaint
          </NavLink>
          <NavLink to="/track" className={linkClass} onClick={() => setOpen(false)}>
            Track Complaint
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
