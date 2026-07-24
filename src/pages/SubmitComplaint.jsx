import { incrementSupportCount } from '../services/supportService'
import { useEffect, useRef, useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { uploadImage } from '../services/cloudinary'
import { DEPARTMENTS, suggestDepartment } from '../services/ai'
import { useReverseGeocode } from '../hooks/useReverseGeocode'
import LocationMap from '../components/LocationMap'
import { findNearbyDuplicates } from '../services/duplicates'
// Short, human-readable complaint IDs like "SCC-8F3K2P".
// Avoids visually confusing characters (0/O, 1/I).
function generateComplaintId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `SCC-${code}`
}

function IconUpload(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

function IconCamera(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

function IconTrash(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7h16" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  )
}

function IconPin(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s7-7.58 7-12.5A7 7 0 0 0 5 9.5C5 14.42 12 22 12 22Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  )
}

function IconLayers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </svg>
  )
}

function IconEdit(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    </svg>
  )
}

function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function IconSparkle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3c.6 3.2 1.8 5 5 6-3.2 1-4.4 2.8-5 6-.6-3.2-1.8-5-5-6 3.2-1 4.4-2.8 5-6Z" />
      <path d="M19 15c.3 1.4.9 2.1 2 2.5-1.1.4-1.7 1.1-2 2.5-.3-1.4-.9-2.1-2-2.5 1.1-.4 1.7-1.1 2-2.5Z" />
    </svg>
  )
}

function IconUsers(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.2c2.3.4 4.5 2.3 4.5 5.8" />
    </svg>
  )
}
export default function SubmitComplaint() {
  const [step, setStep] = useState('form') // 'form' | 'preview' | 'success'

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [description, setDescription] = useState('')
  const [descTouched, setDescTouched] = useState(false)
  const [location, setLocation] = useState(null)
  const [supportingId, setSupportingId] = useState(null)
  const [supportedReports, setSupportedReports] = useState(new Set())
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  const [duplicates, setDuplicates] = useState([])
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)

  const [department, setDepartment] = useState('auto')

  const [aiSuggestion, setAiSuggestion] = useState(null) // { department, confidence } | null
  const [analyzing, setAnalyzing] = useState(false)
  const [aiError, setAiError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [complaintId, setComplaintId] = useState(null)
  const {
    address,
    loading: addressLoading,
    error: addressError,
  } = useReverseGeocode(
    step === 'success' ? location?.lat : null,
    step === 'success' ? location?.lng : null
  )
  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])
  useEffect(() => {
    if (!location || description.trim().length < 10) {
      setDuplicates([])
      return
    }

    let cancelled = false

    setCheckingDuplicates(true)

    findNearbyDuplicates(location.lat, location.lng)
      .then((results) => {
        if (!cancelled) {
          setDuplicates(results)
        }
      })
      .catch((err) => {
        console.error('Duplicate detection failed:', err)

        if (!cancelled) {
          setDuplicates([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingDuplicates(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [location, description])
  const isDescriptionValid = description.trim().length >= 15 && description.length <= 500
  const isFormValid = Boolean(imageFile) && isDescriptionValid && Boolean(location)

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleRemoveImage() {
    setImageFile(null)
    setImagePreview(null)
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  function handleDescriptionChange(e) {
    setDescription(e.target.value)
    // A changed description invalidates any earlier AI suggestion.
    if (aiSuggestion || aiError) {
      setAiSuggestion(null)
      setAiError('')
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.')
      return
    }
    setLocating(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please enable it in your browser settings.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('Location information is unavailable right now.')
        } else if (err.code === err.TIMEOUT) {
          setLocationError('Location request timed out. Please try again.')
        } else {
          setLocationError('Could not fetch your location. Please try again.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  }

  async function handleAnalyze() {
    setAiError('')
    setAnalyzing(true)
    try {
      const result = await suggestDepartment(description)
      setAiSuggestion(result)
      setDepartment(result.department)
    } catch (err) {
      console.error(err)
      setAiSuggestion(null)
      setAiError(err.message || 'Could not analyze the description. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }
async function handleSupport(complaintId) {
  if (supportedReports.has(complaintId)) return

  setSupportingId(complaintId)

  try {
    await incrementSupportCount(complaintId)

    setDuplicates((prev) =>
      prev.map((item) =>
        item.id === complaintId
          ? {
              ...item,
              supportCount: (item.supportCount || 0) + 1,
            }
          : item
      )
    )

    setSupportedReports((prev) => {
      const updated = new Set(prev)
      updated.add(complaintId)
      return updated
    })
  } catch (err) {
    console.error('Failed to support complaint:', err)
    alert('Unable to support this complaint. Please try again.')
  } finally {
    setSupportingId(null)
  }
}
  function handleReset() {
    setImageFile(null)
    setImagePreview(null)
    setDescription('')
    setDescTouched(false)
    setLocation(null)
    setLocationError('')
    setDepartment('auto')
    setAiSuggestion(null)
    setAnalyzing(false)
    setAiError('')
    setSubmitError('')
    setComplaintId(null)
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  function handleNext(e) {
    e.preventDefault()
    if (!isFormValid) return
    setStep('preview')
  }

  async function handleSubmit() {
    setSubmitError('')
    setSubmitting(true)
    try {
      const newComplaintId = generateComplaintId()
      const imageUrl = await uploadImage(imageFile)

      await setDoc(doc(db, 'complaints', newComplaintId), {
        complaintId: newComplaintId,
        description,
        department: department === 'auto' ? 'Auto Detect' : department,
        lat: location.lat,
        lng: location.lng,
        imageUrl,
        status: 'Submitted',
        createdAt: serverTimestamp(),
      })

      setComplaintId(newComplaintId)
      setStep('success')
    } catch (err) {
      console.error(err)
      setSubmitError('Something went wrong submitting your complaint. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'success') {
    return (
      <main className="submit-page">
        <div className="page-head">
          <p className="eyebrow">Success</p>
          <h1>Complaint Submitted</h1>
          <p className="page-sub">Your complaint has been recorded. Save this ID to track its progress.</p>
        </div>

        <div className="preview-card success-card">
          <div className="success-icon">
            <IconCheck />
          </div>
          <p className="success-id-label">Complaint ID</p>
          <p className="success-id">{complaintId}</p>
          <p className="preview-note">Status: Submitted</p>
          {addressLoading && (
            <p className="ai-hint">Looking up address...</p>
          )}

          {addressError && (
            <p className="field-error">{addressError}</p>
          )}

          {address && (
            <p className="preview-note">{address}</p>
          )}

          <LocationMap
            lat={location?.lat}
            lng={location?.lng}
            popupText={complaintId}
          />
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                handleReset()
                setStep('form')
              }}
            >
              Submit Another Complaint
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'preview') {
    const departmentLabel = department === 'auto' ? 'Not selected' : department

    return (
      <main className="submit-page">
        <div className="page-head">
          <p className="eyebrow">Review</p>
          <h1>Review Your Complaint</h1>
          <p className="page-sub">Check the details below, then submit when you're ready.</p>
        </div>

        <div className="preview-card">
          <img src={imagePreview} alt="Complaint" className="preview-image" />

          <div className="preview-block">
            <span className="preview-row-label">Description</span>
            <p className="preview-description">{description}</p>
          </div>

          <div className="preview-row">
            <span className="preview-row-label">Latitude</span>
            <span className="preview-row-value">{location.lat.toFixed(6)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-row-label">Longitude</span>
            <span className="preview-row-value">{location.lng.toFixed(6)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-row-label">Address</span>
            <span className="preview-row-value">Not available yet (Milestone 3)</span>
          </div>
          <div className="preview-row">
            <span className="preview-row-label">Department</span>
            <span className="preview-row-value">{departmentLabel}</span>
          </div>

          {submitError && <p className="field-error">{submitError}</p>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setStep('form')}
              disabled={submitting}
            >
              <IconEdit /> Back to Edit
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" /> Submitting…
                </>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="submit-page">
      <div className="page-head">
        <p className="eyebrow">Report an Issue</p>
        <h1>Submit a Complaint</h1>
        <p className="page-sub">
          Fill in the details below — you'll review everything before it's finalized.
        </p>
      </div>

      <form className="form-card" onSubmit={handleNext}>
        <section className="form-section">
          <span className="section-label">
            <IconUpload className="section-icon" /> Complaint Image
          </span>

          {!imagePreview ? (
            <div className="upload-row">
              <button
                type="button"
                className="upload-btn"
                onClick={() => galleryInputRef.current?.click()}
              >
                <IconUpload /> Choose from Gallery
              </button>
              <button
                type="button"
                className="upload-btn"
                onClick={() => cameraInputRef.current?.click()}
              >
                <IconCamera /> Take Photo
              </button>
            </div>
          ) : (
            <div className="image-preview-wrap">
              <img src={imagePreview} alt="Selected complaint" className="image-preview" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={handleRemoveImage}
                aria-label="Remove image"
              >
                <IconTrash />
              </button>
            </div>
          )}

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            hidden
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            hidden
          />
        </section>

        <div className="section-divider" />

        <section className="form-section">
          <label className="section-label" htmlFor="description">
            <IconEdit className="section-icon" /> Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            onBlur={() => setDescTouched(true)}
            maxLength={500}
            rows={4}
            placeholder="Describe the issue — what's wrong, and any details that would help the department act on it."
          />
          <div className="char-counter">
            {descTouched && description.trim().length < 15 ? (
              <span className="counter-hint">Minimum 15 characters</span>
            ) : (
              <span />
            )}
            <span className="counter-count">{description.length} / 500</span>
          </div>
        </section>

        <div className="section-divider" />

        <section className="form-section">
          <span className="section-label">
            <IconPin className="section-icon" /> Location
          </span>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleUseLocation}
            disabled={locating}
          >
            {locating ? (
              <>
                <span className="spinner" /> Fetching location…
              </>
            ) : location ? (
              <>
                <IconCheck /> Location Captured
              </>
            ) : (
              'Use My Location'
            )}
          </button>

          {location && (
            <div className="coord-grid">
              <div className="coord-box">
                <span className="coord-label">Latitude</span>
                <span className="coord-value">{location.lat.toFixed(6)}</span>
              </div>
              <div className="coord-box">
                <span className="coord-label">Longitude</span>
                <span className="coord-value">{location.lng.toFixed(6)}</span>
              </div>
            </div>
          )}

          {locationError && <p className="field-error">{locationError}</p>}
          {location && (
            <div style={{ marginTop: '16px' }}>
              <span className="section-label">
                <IconUsers className="section-icon" /> Nearby Reports
              </span>

              {checkingDuplicates && (
                <p className="ai-hint">Checking for similar reports nearby…</p>
              )}

              {!checkingDuplicates && duplicates.length > 0 && (
                <div className="duplicate-list">
                  {duplicates.slice(0, 3).map((d) => (
                    <div className="duplicate-item" key={d.id}>
                      {d.imageUrl && (
                        <img
                          src={d.imageUrl}
                          alt="Nearby report"
                          className="duplicate-item-image"
                        />
                      )}

                      <div className="duplicate-item-body">
                        <p className="duplicate-item-description">
                          {d.description}
                        </p>

                        <span className="duplicate-item-meta">
                          {Math.round(d.distanceMeters)}m away • {d.status}
                        </span>

                        <p
                          style={{
                            marginTop: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                          }}
                        >
                          👍 {d.supportCount || 0} Supports
                        </p>

                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ marginTop: '10px' }}
                          onClick={() => handleSupport(d.id)}
                          disabled={
                            supportingId === d.id ||
                            supportedReports.has(d.id)
                          }
                        >
                          {supportingId === d.id
                            ? 'Supporting...'
                            : supportedReports.has(d.id)
                            ? '✓ Supported'
                            : 'Support This Report'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!checkingDuplicates && duplicates.length === 0 && (
                <p className="ai-hint">
                  No similar reports found nearby.
                </p>
              )}
            </div>
          )}
        </section>

        <div className="section-divider" />

        <section className="form-section">
          <label className="section-label" htmlFor="address">
            Address
          </label>
          <input
            id="address"
            type="text"
            className="address-input"
            readOnly
            value=""
            placeholder="Address lookup will be added in Milestone 3"
          />
        </section>

        <div className="section-divider" />

        <section className="form-section">
          <span className="section-label">
            <IconSparkle className="section-icon" /> AI Department Suggestion
          </span>

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleAnalyze}
            disabled={!isDescriptionValid || analyzing}
          >
            {analyzing ? (
              <>
                <span className="spinner" /> Analyzing…
              </>
            ) : (
              <>
                <IconSparkle /> Analyze with AI
              </>
            )}
          </button>

          {descTouched && !isDescriptionValid && (
            <p className="ai-hint">Write at least 15 characters in the description to analyze.</p>
          )}

          {aiError && <p className="field-error">{aiError}</p>}

          {aiSuggestion && (
            <div className="ai-suggestion-box">
              <span className="ai-suggestion-label">Suggested Department:</span>
              <span className="ai-suggestion-value">{aiSuggestion.department}</span>
              <span className="ai-suggestion-confidence">
                {Math.round(aiSuggestion.confidence * 100)}% confidence
              </span>
            </div>
          )}
        </section>

        <div className="section-divider" />

        <section className="form-section">
          <label className="section-label" htmlFor="department">
            <IconLayers className="section-icon" /> Department
          </label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="auto">Select department (or use AI above)</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {aiSuggestion && department === aiSuggestion.department && (
            <p className="ai-hint">Auto-filled from the AI suggestion — change it above if needed.</p>
          )}
        </section>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className="btn btn-primary" disabled={!isFormValid}>
            Next
          </button>
        </div>
      </form>
    </main>
  )
}