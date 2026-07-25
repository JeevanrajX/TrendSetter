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
const HF_TIMEOUT_MS = 20000

// Labels used to reframe the zero-shot NLI model as a pairwise
// "are these the same civic issue?" classifier. multi_label:false makes
// the two scores mutually exclusive (they sum to 1), so the score for
// DUPLICATE_SAME_LABEL is directly the probability the reports are duplicates.
const DUPLICATE_SAME_LABEL = 'the same civic issue'
const DUPLICATE_DIFF_LABEL = 'two different civic issues'

// Shared translation of a Hugging Face request failure into a
// user-facing Error. Both suggestDepartment() and analyzeDuplicate() hit
// the same Inference endpoint, so they surface the same errors identically.
function mapHfError(err) {
  const status = err.response?.status

  if (status === 401 || status === 403) {
    return new Error(
      'Hugging Face rejected the API key — check VITE_HUGGINGFACE_API_KEY and its "Inference Providers" permission.'
    )
  }
  if (status === 503) {
    return new Error('The AI model is still loading on Hugging Face. Please try again in a few seconds.')
  }
  if (status === 429 || status === 402) {
    return new Error('Hugging Face usage limit reached for this account. Please try again later.')
  }
  if (err.code === 'ECONNABORTED') {
    return new Error('The AI request timed out. Please try again.')
  }
  return new Error(err.response?.data?.error || 'Could not reach the AI service. Please try again.')
}

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
    throw mapHfError(err)
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

// Normalises the zero-shot endpoint's response into a [{ label, score }]
// array. The hf-inference router may return either that array directly
// (as suggestDepartment consumes) or the pipeline's { labels, scores } form.
function toLabelScores(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.labels) && Array.isArray(data.scores)) {
    return data.labels.map((label, i) => ({ label, score: data.scores[i] }))
  }
  return []
}

/**
 * Uses the same Hugging Face zero-shot NLI model as suggestDepartment() to
 * judge whether two complaint descriptions describe the same civic issue.
 * No embeddings or vectors — the pair is classified against two mutually
 * exclusive labels, and the "same issue" probability becomes the confidence.
 *
 * @param {string} newDescription
 * @param {string} existingDescription
 * @returns {Promise<{ duplicate: boolean, confidence: number, reason: string }>}
 * confidence is an integer 0–100.
 */
export async function analyzeDuplicate(newDescription, existingDescription) {
  const a = newDescription?.trim()
  const b = existingDescription?.trim()
  if (!a || !b) {
    throw new Error('Both complaint descriptions are required to compare them.')
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
        inputs: `Report A: ${a}\n\nReport B: ${b}`,
        parameters: {
          candidate_labels: [DUPLICATE_SAME_LABEL, DUPLICATE_DIFF_LABEL],
          hypothesis_template: 'These two civic complaints describe {}.',
          multi_label: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: HF_TIMEOUT_MS,
      }
    )
  } catch (err) {
    throw mapHfError(err)
  }

  const pairs = toLabelScores(response.data)
  if (pairs.length === 0) {
    throw new Error('The AI service returned an unexpected response.')
  }

  // Read the "same issue" score directly. If that label is somehow absent,
  // fall back to 0 (indeterminate → treat as NOT a duplicate) rather than
  // guessing with another label's score, which could invert the verdict.
  const same = pairs.find((p) => p.label === DUPLICATE_SAME_LABEL)

  const sameScore = typeof same?.score === 'number' ? same.score : 0
  const confidence = Math.round(sameScore * 100)
  const duplicate = sameScore >= 0.5

  const reason = duplicate
    ? `AI judged both reports to describe the same civic issue (${confidence}% confidence).`
    : `AI judged the reports to describe different issues (${confidence}% same-issue confidence).`

  return { duplicate, confidence, reason }
}