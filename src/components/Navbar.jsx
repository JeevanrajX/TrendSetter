import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { logout } from '../services/auth'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const { user, role } = useAuth()

  const linkClass = ({ isActive }) => (isActive ? 'active' : '')

  function closeMenu() {
    setOpen(false)
  }

  async function handleLogout() {
    try {
      await logout()
      closeMenu()
      navigate('/login/user')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={closeMenu}>
          <img
            src={logo}
            alt="Smart Civic Connect Logo"
            className="brand-logo"
          />
          <span className="brand-name">Smart Civic Connect</span>
        </Link>

        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink
            to="/"
            end
            className={linkClass}
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <NavLink
            to="/submit"
            className={linkClass}
            onClick={closeMenu}
          >
            Submit Complaint
          </NavLink>

          {user && (
            <NavLink
              to="/my-complaints"
              className={linkClass}
              onClick={closeMenu}
            >
              My Complaints
            </NavLink>
          )}

          <NavLink
            to="/track"
            className={linkClass}
            onClick={closeMenu}
          >
            Track Complaint
          </NavLink>

          {role === 'admin' && (
            <NavLink
              to="/admin"
              className={linkClass}
              onClick={closeMenu}
            >
              Admin Dashboard
            </NavLink>
          )}

          {!user ? (
            <>
              <NavLink
                to="/login/user"
                className={linkClass}
                onClick={closeMenu}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={linkClass}
                onClick={closeMenu}
              >
                Register
              </NavLink>
            </>
          ) : (
            <button
              type="button"
              className="nav-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}