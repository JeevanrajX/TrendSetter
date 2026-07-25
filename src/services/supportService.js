import {
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Atomically increments the support count of a complaint.
 * If supportCount doesn't exist, Firestore creates it automatically.
 *
 * @param {string} complaintId - Firestore document ID
 * @returns {Promise<boolean>}
 */
export async function incrementSupportCount(complaintId) {
  const complaintRef = doc(db, 'complaints', complaintId)

  await updateDoc(complaintRef, {
    supportCount: increment(1),
  })

  return true
}

/**
 * Merges a new report into an existing complaint it duplicates. Bumps the
 * support and duplicate-report counters, records when it was last reported
 * and merged, and stores the detection scores so the admin dashboard can
 * show why the merge happened.
 *
 * @param {string} complaintId - Firestore document ID of the existing complaint
 * @param {Object} [scores]
 * @param {number} [scores.overallScore]
 * @param {number} [scores.locationScore]
 * @param {number} [scores.aiScore]
 * @param {string} [scores.reason]
 * @returns {Promise<boolean>}
 */
export async function mergeDuplicateReport(complaintId, scores = {}) {
  const complaintRef = doc(db, 'complaints', complaintId)

  const update = {
    supportCount: increment(1),
    duplicateReports: increment(1),
    lastReportedAt: serverTimestamp(),
    lastMergedAt: serverTimestamp(),

    mergedHistory: arrayUnion({
      timestamp: new Date().toISOString(),
    }),
  }

  if (scores.overallScore != null) update.duplicateScore = scores.overallScore
  if (scores.locationScore != null) update.locationScore = scores.locationScore
  if (scores.aiScore != null) update.aiScore = scores.aiScore
  if (scores.reason) update.duplicateReason = scores.reason

  await updateDoc(complaintRef, update)

  return true
}