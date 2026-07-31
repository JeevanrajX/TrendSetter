import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

function friendlyAuthError(err) {
  switch (err.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export async function register(email, password, name) {
  let credential
  try {
    credential = await createUserWithEmailAndPassword(auth, email, password)
  } catch (err) {
    throw new Error(friendlyAuthError(err))
  }

  await setDoc(doc(db, 'users', credential.user.uid), {
    uid: credential.user.uid,
    name: name || '',
    email,
    role: 'user',
  })

  return credential.user
}

export async function login(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  } catch (err) {
    throw new Error(friendlyAuthError(err))
  }
}

export async function logout() {
  await signOut(auth)
}

export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data().role ?? null) : null
}