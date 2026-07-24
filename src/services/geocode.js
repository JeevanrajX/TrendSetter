import axios from 'axios'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

/**
 * Reverse geocodes coordinates into a human-readable address using
 * OpenStreetMap's Nominatim API (free, no API key required).
 *
 * Nominatim's usage policy caps unauthenticated traffic at roughly
 * 1 request/second — fine for a single lookup, but callers showing many
 * locations at once (e.g. the Admin map) should geocode one at a time
 * rather than firing requests for every marker simultaneously.
 */
export async function reverseGeocode(lat, lng) {
  let response
  try {
    response = await axios.get(NOMINATIM_URL, {
      params: {
        format: 'jsonv2',
        lat,
        lon: lng,
      },
      headers: {
        'Accept-Language': 'en',
      },
      timeout: 10000,
    })
  } catch (err) {
    if (err.response?.status === 429) {
      throw new Error('Too many address lookups right now. Please try again shortly.')
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('The address lookup timed out. Please try again.')
    }
    throw new Error('Could not look up the address. Please try again.')
  }

  if (!response.data?.display_name) {
    throw new Error('No address found for this location.')
  }

  return response.data.display_name
}