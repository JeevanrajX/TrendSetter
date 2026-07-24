// src/services/duplicates.js

import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

const DEFAULT_RADIUS_METERS = 500

/**
 * Calculates the great-circle distance between two latitude/longitude
 * coordinates using the Haversine formula.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in meters
 */
function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth's radius in meters

  const toRad = (deg) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Finds unresolved complaints near the given location.
 *
 * Duplicate detection is based only on geographic proximity.
 * Department is intentionally ignored because AI classification
 * may differ for reports describing the same real-world issue.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {Object} [options]
 * @param {number} [options.radiusMeters=150]
 *
 * @returns {Promise<Array<Object>>}
 * Returns nearby complaints sorted by distance.
 * Each complaint includes:
 * - Firestore document id
 * - Original complaint data
 * - distanceMeters
 */
export async function findNearbyDuplicates(
  lat,
  lng,
  options = {}
) {
  const {
    radiusMeters = DEFAULT_RADIUS_METERS,
  } = options

  const snapshot = await getDocs(collection(db, 'complaints'))

  const matches = []

  snapshot.forEach((docSnap) => {
    const data = docSnap.data()

    // Ignore resolved complaints
    if (data.status === 'Resolved') return

    // Ignore complaints without valid coordinates
    if (data.lat == null || data.lng == null) return

    const distanceMeters = haversineDistanceMeters(
      lat,
      lng,
      data.lat,
      data.lng
    )

    if (distanceMeters > radiusMeters) return

    matches.push({
      ...data,
      id: docSnap.id,
      distanceMeters,
    })
  })

  matches.sort((a, b) => a.distanceMeters - b.distanceMeters)

  return matches
}