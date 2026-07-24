import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useReverseGeocode } from '../hooks/useReverseGeocode'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function statusBadgeClass(status) {
  if (status === 'Resolved') return 'status-badge status-resolved'
  if (status === 'In Progress') return 'status-badge status-in-progress'
  return 'status-badge'
}

// Fits the map to every marker on mount / whenever the marker set
// changes, instead of a fixed zoom that might not show them all.
function FitBounds({ positions }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30], maxZoom: 15 })
    }
  }, [positions, map])

  return null
}

// Only ever mounted for the ONE complaint currently selected (see
// activeId below) rather than declared per-marker — that's what
// guarantees the address lookup fires for a marker someone actually
// clicked, and never for all of them at once on page load.
function MarkerPopupContent({ complaint }) {
  const { address, loading, error } = useReverseGeocode(complaint.lat, complaint.lng)

  return (
    <div className="map-popup">
      <img src={complaint.imageUrl} alt="Complaint" className="map-popup-image" />
      <p className="map-popup-id">{complaint.complaintId}</p>
      <div className="map-popup-row">
        <span>{complaint.department}</span>
        <span className={statusBadgeClass(complaint.status)}>{complaint.status}</span>
      </div>
      <p className="map-popup-address">{loading ? 'Looking up address…' : error || address}</p>
    </div>
  )
}

/**
 * One map showing every complaint that has a location. Clicking a
 * marker reveals its ID, department, status, image, and address.
 */
export default function ComplaintsMap({ complaints }) {
  const [activeId, setActiveId] = useState(null)

  const located = complaints.filter((c) => c.lat != null && c.lng != null)

  if (located.length === 0) {
    return <p className="preview-note">No complaint locations to show yet.</p>
  }

  const positions = located.map((c) => [c.lat, c.lng])
  const activeComplaint = located.find((c) => c.complaintId === activeId) || null

  return (
    <MapContainer center={positions[0]} zoom={12} scrollWheelZoom={false} className="admin-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds positions={positions} />
      {located.map((c) => (
        <Marker
          key={c.complaintId}
          position={[c.lat, c.lng]}
          icon={defaultIcon}
          eventHandlers={{ click: () => setActiveId(c.complaintId) }}
        />
      ))}
      {activeComplaint && (
        <Popup
          position={[activeComplaint.lat, activeComplaint.lng]}
          eventHandlers={{ remove: () => setActiveId(null) }}
        >
          <MarkerPopupContent complaint={activeComplaint} />
        </Popup>
      )}
    </MapContainer>
  )
}