// src/hooks/useReverseGeocode.js (new)
import { useEffect, useState } from 'react'
import { reverseGeocode } from '../services/geocode'

/**
 * Resolves lat/lng into a human-readable address, tracking loading and
 * error state. Re-runs whenever lat/lng change. Pass null/undefined for
 * either value to skip the lookup (e.g. before a location exists yet).
 */
export function useReverseGeocode(lat, lng) {
  const [address, setAddress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (lat == null || lng == null) {
      setAddress(null)
      setError('')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    reverseGeocode(lat, lng)
      .then((result) => {
        if (!cancelled) setAddress(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not look up the address.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lat, lng])

  return { address, loading, error }
}