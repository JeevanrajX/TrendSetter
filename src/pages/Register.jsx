// src/pages/Register.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/auth'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await register(email, password, name)
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
        <p className="eyebrow">Get Started</p>
        <h1>Create an Account</h1>
        <p className="page-sub">Register to submit and track civic complaints.</p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <section className="form-section">
          <label className="section-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </section>

        <section className="form-section">
          <label className="section-label" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </section>

        <section className="form-section">
          <label className="section-label" htmlFor="reg-password">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </section>

        <section className="form-section">
          <label className="section-label" htmlFor="confirm-password">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            className="text-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </section>

        {error && <p className="field-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner" /> Creating account…
            </>
          ) : (
            'Register'
          )}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login/user">Log In</Link>
        </p>
      </form>
    </main>
  )
}