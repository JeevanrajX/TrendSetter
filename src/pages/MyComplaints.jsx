import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function MyComplaints() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchComplaints() {
      try {
        console.log('Logged in UID:', user.uid)

        const q = query(
          collection(db, 'complaints'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )

        const snapshot = await getDocs(q)

        console.log('Documents found:', snapshot.size)

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        console.log('Complaints:', data)

        setComplaints(data)
      } catch (err) {
        console.error('Firestore Error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchComplaints()
    }
  }, [user])

  if (loading) {
    return <h2 style={{ textAlign: 'center' }}>Loading...</h2>
  }

  return (
    <main className="submit-page">
      <div className="page-head">
        <p className="eyebrow">History</p>
        <h1>My Complaints</h1>
        <p className="page-sub">
          View all complaints submitted by you.
        </p>
      </div>

      {complaints.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No complaints found.</p>
      ) : (
        complaints.map((item) => (
          <div
            key={item.id}
            className="preview-card"
            style={{ marginBottom: '20px', cursor: 'pointer' }}
            onClick={() => navigate(`/complaint/${item.complaintId}`)}
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt="Complaint"
                className="preview-image"
              />
            )}

            <p><strong>ID:</strong> {item.complaintId}</p>
            <p><strong>Description:</strong> {item.description}</p>
            <p><strong>Department:</strong> {item.department}</p>
            <p><strong>Status:</strong> {item.status}</p>
          </div>
        ))
      )}
    </main>
  )
}