import axios from 'axios'

// Single source of truth for department options — used both for the
// dropdown in SubmitComplaint.jsx and as the AI's candidate labels, so
// the two lists can never drift out of sync.
export const DEPARTMENTS = [
  'Roads',
  'Garbage',
  'Drainage',
  'Water Supply',
  'Street Lights',
  'Electricity',
  'Public Transport',
  'Health',
  'Parks',
  'Other',
]

// Hugging Face now routes all Inference Providers traffic through a single
// "router" host — this is NOT the old api-inference.huggingface.co URL.
const HF_MODEL = 'MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7'
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`
const HF_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_KEY

/**
 * Classifies a complaint description into one of DEPARTMENTS using
 * Hugging Face's zero-shot-classification pipeline. Only the description
 * text is sent to the API — no image, location, or other complaint data.
 *
 * @param {string} description
 * @returns {Promise<{ department: string, confidence: number }>}
 */
export async function suggestDepartment(description) {
  const text = description?.trim()
  if (!text) {
    throw new Error('Please write a description before analyzing.')
  }
  if (!HF_TOKEN) {
    throw new Error(
      'Missing Hugging Face API key. Add VITE_HUGGINGFACE_API_KEY to your .env file.'
    )
  }

  let response
  try {
    response = await axios.post(
      HF_API_URL,
      {
        inputs: text,
        parameters: {
          candidate_labels: DEPARTMENTS,
          hypothesis_template: 'This complaint is about {}.',
          multi_label: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    )
  } catch (err) {
    const status = err.response?.status

    if (status === 401 || status === 403) {
      throw new Error(
        'Hugging Face rejected the API key — check VITE_HUGGINGFACE_API_KEY and its "Inference Providers" permission.'
      )
    }
    if (status === 503) {
      throw new Error('The AI model is still loading on Hugging Face. Please try again in a few seconds.')
    }
    if (status === 429 || status === 402) {
      throw new Error('Hugging Face usage limit reached for this account. Please try again later.')
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('The AI request timed out. Please try again.')
    }
    throw new Error(err.response?.data?.error || 'Could not reach the AI service. Please try again.')
  }

  const results = response.data
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('The AI service returned an unexpected response.')
  }

  const best = results.reduce((top, current) => (current.score > top.score ? current : top))

  return {
    department: best.label,
    confidence: best.score,
  }
}