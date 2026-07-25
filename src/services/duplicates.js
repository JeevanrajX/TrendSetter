// src/services/duplicates.js

import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import { analyzeDuplicate } from './ai'

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

/**
 * Converts a Haversine distance into a location similarity score.
 *
 * @param {number} distanceMeters
 * @returns {number} 0–100
 */
function locationScoreForDistance(distanceMeters) {
  if (distanceMeters <= 100) return 100
  if (distanceMeters <= 250) return 80
  if (distanceMeters <= 500) return 60
  return 0
}

/**
 * Intelligent duplicate detection. Finds nearby complaints, runs the AI
 * text comparison against each, and blends geographic proximity with the
 * AI's confidence into an overall score.
 *
 * Overall = 40% Location + 60% AI. If the AI comparison for a candidate
 * fails (rate limit, timeout, bad key…), that candidate degrades to a
 * location-only score rather than breaking the whole submit flow.
 *
 * @param {string} newDescription
 * @param {number} lat
 * @param {number} lng
 * @param {Object} [options]
 * @param {number} [options.radiusMeters=500]
 * @param {number} [options.maxComparisons] Optional hard cap on the number
 *   of AI comparisons; omitted means every nearby complaint is compared.
 *
 * @returns {Promise<Array<{
 *   overallScore: number,
 *   locationScore: number,
 *   aiScore: number,
 *   reason: string,
 *   complaint: Object,
 * }>>} Sorted by overallScore, descending.
 */
export async function analyzeNearbyDuplicates(newDescription, lat, lng, options = {}) {
  const {
    radiusMeters = DEFAULT_RADIUS_METERS,
    maxComparisons,
  } = options

  const nearby = await findNearbyDuplicates(lat, lng, { radiusMeters })
  // Compare against every nearby complaint by default. The final ranking
  // blends location and AI, so a farther complaint can still be the best
  // match — pre-filtering by distance would hide those.
  const candidates = maxComparisons ? nearby.slice(0, maxComparisons) : nearby
  const scored = []

  // Sequential, not Promise.all: a concurrent burst against the shared
  // Hugging Face endpoint tends to hit the free-tier rate limit (429),
  // which would degrade real duplicates to a location-only score.
  for (const complaint of candidates) {
    const locationScore = locationScoreForDistance(complaint.distanceMeters)

    let aiScore = 0
    let reason = 'AI comparison unavailable — scored on location only.'

    try {
      const result = await analyzeDuplicate(newDescription, complaint.description)

      console.log(
        "AI Result:",
        JSON.stringify(result, null, 2)
      );

      aiScore = result.confidence
      reason = result.reason
    } catch (err) {
      console.error("AI duplicate comparison failed:", err);
    }
    const overallScore = Math.round(0.4 * locationScore + 0.6 * aiScore)

    scored.push({ overallScore, locationScore, aiScore, reason, complaint })
  }

  scored.sort((a, b) => b.overallScore - a.overallScore)

  return scored
}