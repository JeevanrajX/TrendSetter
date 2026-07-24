import { doc, updateDoc, increment } from 'firebase/firestore'
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