import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p>
  }

  if (!user) {
    return <Navigate to="/login/admin" replace />
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}