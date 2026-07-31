// src/pages/LoginAdmin.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, logout, getUserRole } from '../services/auth'

export default function LoginAdmin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email, password)
      const role = await getUserRole(user.uid)

      if (role !== 'admin') {
        await logout()
        setError('This login is for administrators only.')
        return
      }

      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="submit-page">
      <div className="page-head">
        <p className="eyebrow">Admin</p>
        <h1>Admin Login</h1>
        <p className="page-sub">For department staff only.</p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <section className="form-section">
          <label className="section-label" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </section>

        <section className="form-section">
          <label className="section-label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </section>

        {error && <p className="field-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner" /> Logging in…
            </>
          ) : (
            'Log In'
          )}
        </button>
      </form>
    </main>
  )
}