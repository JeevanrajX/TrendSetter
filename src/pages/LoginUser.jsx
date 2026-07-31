// src/pages/LoginUser.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/auth'

export default function LoginUser() {
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
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="submit-page">
      <div className="page-head">
        <p className="eyebrow">Welcome Back</p>
        <h1>Log In</h1>
        <p className="page-sub">Log in to submit and manage your complaints.</p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <section className="form-section">
          <label className="section-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </section>

        <section className="form-section">
          <label className="section-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
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

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </main>
  )
}