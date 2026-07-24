// src/pages/AdminDashboard.jsx (new file)
import { useEffect, useState } from 'react'
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { DEPARTMENTS } from '../services/ai'
import ComplaintsMap from '../components/ComplaintsMap'
const STATUSES = ['Submitted', 'In Progress', 'Resolved']

function formatTimestamp(ts) {
  if (!ts) return '—'
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts)
  return date.toLocaleString()
}

function statusBadgeClass(status) {
  if (status === 'Resolved') return 'status-badge status-resolved'
  if (status === 'In Progress') return 'status-badge status-in-progress'
  return 'status-badge'
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchId, setSearchId] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  async function fetchComplaints() {
    setLoading(true)
    setError('')
    try {
      const snap = await getDocs(collection(db, 'complaints'))
      const list = snap.docs.map((d) => d.data())
      list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      setComplaints(list)
    } catch (err) {
      console.error(err)
      setError('Could not load complaints. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  async function handleStatusChange(complaintId, newStatus) {
    setError('')
    const previous = complaints
    setComplaints((prev) =>
      prev.map((c) => (c.complaintId === complaintId ? { ...c, status: newStatus } : c))
    )
    try {
      await updateDoc(doc(db, 'complaints', complaintId), { status: newStatus })
    } catch (err) {
      console.error(err)
      setError(`Could not update status for ${complaintId}. Please try again.`)
      setComplaints(previous)
    }
  }

  const totalCount = complaints.length
  const submittedCount = complaints.filter((c) => c.status === 'Submitted').length
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      !searchId.trim() || c.complaintId?.toLowerCase().includes(searchId.trim().toLowerCase())
    const matchesDept = departmentFilter === 'all' || c.department === departmentFilter
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesDept && matchesStatus
  })

  if (loading) {
    return (
      <main className="submit-page dashboard-page">
        <div className="page-head">
          <p className="eyebrow">Admin</p>
          <h1>Admin Dashboard</h1>
          <p className="page-sub">Review, filter, and update every submitted complaint.</p>
        </div>
        <div className="dashboard-status">
          <span className="spinner-dark" /> Loading complaints…
        </div>
      </main>
    )
  }

  if (error && complaints.length === 0) {
    return (
      <main className="submit-page dashboard-page">
        <div className="page-head">
          <p className="eyebrow">Admin</p>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="dashboard-error">
          <p className="field-error">{error}</p>
          <button type="button" className="btn btn-outline" onClick={fetchComplaints}>
            Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="submit-page dashboard-page">
      <div className="page-head">
        <p className="eyebrow">Admin</p>
        <h1>Admin Dashboard</h1>
        <p className="page-sub">Review, filter, and update every submitted complaint.</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-value">{totalCount}</span>
          <span className="summary-label">Total Complaints</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{submittedCount}</span>
          <span className="summary-label">Submitted</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{inProgressCount}</span>
          <span className="summary-label">In Progress</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{resolvedCount}</span>
          <span className="summary-label">Resolved</span>
        </div>
      </div>
      <ComplaintsMap complaints={complaints} />
      <div className="form-card">
        <div className="toolbar-row">
          <input
            type="text"
            className="search-input"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Search by Complaint ID"
          />
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="field-error dashboard-inline-error">{error}</p>}

      {filteredComplaints.length === 0 ? (
        <p className="preview-note">
          {complaints.length === 0
            ? 'No complaints have been submitted yet.'
            : 'No complaints match your search or filters.'}
        </p>
      ) : (
        <div className="admin-grid">
          {filteredComplaints.map((c) => (
            <div className="admin-card" key={c.complaintId}>
              <img src={c.imageUrl} alt="Complaint" className="admin-card-image" />
              <div className="admin-card-body">
                <div className="admin-card-top">
                  <span className="admin-card-id">{c.complaintId}</span>
                  <span className={statusBadgeClass(c.status)}>{c.status}</span>
                </div>
                <p className="admin-card-description">{c.description}</p>
                <div className="admin-card-meta">
                  <span>{c.department}</span>
                  <span>{formatTimestamp(c.createdAt)}</span>
                </div>
                <label className="admin-card-status-label" htmlFor={`status-${c.complaintId}`}>
                  Update Status
                </label>
                <select
                  id={`status-${c.complaintId}`}
                  value={c.status}
                  onChange={(e) => handleStatusChange(c.complaintId, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}