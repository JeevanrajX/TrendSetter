// src/components/LocationMap.jsx (new)
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Leaflet's default marker icon paths don't resolve correctly through
// Vite's bundler unless explicitly re-pointed like this — without it,
// markers render as broken images.
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

/**
 * A small single-marker map centered on one complaint's location.
 */
export default function LocationMap({ lat, lng, popupText }) {
  if (lat == null || lng == null) return null

  return (
    <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} className="location-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={defaultIcon}>
        {popupText && <Popup>{popupText}</Popup>}
      </Marker>
    </MapContainer>
  )
}