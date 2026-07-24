import { useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useReverseGeocode } from '../hooks/useReverseGeocode'
import LocationMap from '../components/LocationMap'

function IconSearch(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function formatTimestamp(ts) {
  if (!ts) return '—'
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts)
  return date.toLocaleString()
}

export default function TrackComplaint() {
  const [searchId, setSearchId] = useState('')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const {
    address,
    loading: addressLoading,
    error: addressError,
  } = useReverseGeocode(complaint?.lat, complaint?.lng)

  async function handleSearch(e) {
    e.preventDefault()

    const id = searchId.trim().toUpperCase()
    if (!id) return

    setLoading(true)
    setError('')
    setNotFound(false)
    setComplaint(null)

    try {
      const snap = await getDoc(doc(db, 'complaints', id))

      if (snap.exists()) {
        setComplaint(snap.data())
      } else {
        setNotFound(true)
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong looking up your complaint. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="submit-page">
      <div className="page-head">
        <p className="eyebrow">Track</p>
        <h1>Track Your Complaint</h1>
        <p className="page-sub">
          Enter your Complaint ID to check its current status.
        </p>
      </div>

      <div className="track-stack">
        <form className="form-card" onSubmit={handleSearch}>
          <section className="form-section">
            <label className="section-label" htmlFor="complaintId">
              <IconSearch className="section-icon" /> Complaint ID
            </label>

            <div className="search-row">
              <input
                id="complaintId"
                type="text"
                className="search-input"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="e.g. SCC-8F3K2P"
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !searchId.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Searching…
                  </>
                ) : (
                  'Track'
                )}
              </button>
            </div>
          </section>
        </form>

        {error && <p className="field-error">{error}</p>}

        {notFound && (
          <p className="preview-note">
            No complaint found for that ID. Double-check it and try again.
          </p>
        )}

        {complaint && (
          <div className="preview-card">
            <img
              src={complaint.imageUrl}
              alt="Complaint"
              className="preview-image"
            />

            <div className="preview-row">
              <span className="preview-row-label">Complaint ID</span>
              <span className="preview-row-value">
                {complaint.complaintId}
              </span>
            </div>

            <div className="preview-row">
              <span className="preview-row-label">Status</span>
              <span className="preview-row-value">
                <span className="status-badge">{complaint.status}</span>
              </span>
            </div>

            <div className="preview-row">
              <span className="preview-row-label">Department</span>
              <span className="preview-row-value">
                {complaint.department}
              </span>
            </div>

            <div className="preview-block">
              <span className="preview-row-label">Description</span>
              <p className="preview-description">
                {complaint.description}
              </p>
            </div>

            <div className="preview-row">
              <span className="preview-row-label">Latitude</span>
              <span className="preview-row-value">
                {complaint.lat?.toFixed(6)}
              </span>
            </div>

            <div className="preview-row">
              <span className="preview-row-label">Longitude</span>
              <span className="preview-row-value">
                {complaint.lng?.toFixed(6)}
              </span>
            </div>

            <div className="preview-row">
              <span className="preview-row-label">Submitted</span>
              <span className="preview-row-value">
                {formatTimestamp(complaint.createdAt)}
              </span>
            </div>

            <div className="preview-block">
              <span className="preview-row-label">Address</span>

              {addressLoading && (
                <p className="ai-hint">Looking up address...</p>
              )}

              {addressError && (
                <p className="field-error">{addressError}</p>
              )}

              {address && (
                <p className="preview-description">{address}</p>
              )}
            </div>

            <LocationMap
              lat={complaint.lat}
              lng={complaint.lng}
              popupText={complaint.complaintId}
            />
          </div>
        )}
      </div>
    </main>
  )
}