import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SubmitComplaint from './pages/SubmitComplaint'
import TrackComplaint from './pages/TrackComplaint'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<SubmitComplaint />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}