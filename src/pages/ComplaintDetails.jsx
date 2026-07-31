import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useNavigate } from 'react-router-dom'

export default function ComplaintDetails() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchComplaint() {
      try {
        const ref = doc(db, 'complaints', complaintId)
        const snapshot = await getDoc(ref)

        if (snapshot.exists()) {
          setComplaint(snapshot.data())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaint()
  }, [complaintId])

  if (loading) {
    return <h2 style={{ textAlign: 'center' }}>Loading...</h2>
  }

  if (!complaint) {
    return <h2 style={{ textAlign: 'center' }}>Complaint not found.</h2>
  }

  return (
    <main className="submit-page">
      <div className="page-head">
        <p className="eyebrow">Complaint Details</p>
        <h1>{complaint.complaintId}</h1>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/my-complaints')}
        >
          ← Back to My Complaints
        </button>
      </div>

      <div className="preview-card">
        {complaint.imageUrl && (
          <img
            src={complaint.imageUrl}
            alt="Complaint"
            className="preview-image"
          />
        )}
        <p>
          <strong>Submitted On:</strong>{' '}
          {complaint.createdAt
            ? complaint.createdAt.toDate().toLocaleString()
            : 'N/A'}
        </p>
        <p><strong>Description:</strong> {complaint.description}</p>
        <p><strong>Department:</strong> {complaint.department}</p>
        <p>
          <strong>Status:</strong>{' '}
          <span
            className={`status-badge ${complaint.status
              ?.toLowerCase()
              .replace(/\s+/g, '-')}`}
          >
            {complaint.status}
          </span>
        </p>
        <p><strong>Support Count:</strong> {complaint.supportCount}</p>
        <p><strong>Duplicate Reports:</strong> {complaint.duplicateReports}</p>
      </div>
    </main>
  )
}