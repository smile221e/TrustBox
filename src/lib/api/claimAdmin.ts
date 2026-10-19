import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import { BOOTSTRAP_SUPER_ADMIN_EMAIL } from '@/lib/admin-bootstrap'
import { normalizeEmail } from '@/lib/access'
import { getDb, getFirebaseAuth } from '@/lib/firebase'
import type { AdminRole } from '@/lib/constants'
import type { AdminProfile } from '@/types/admin'

function inviteId(email: string) {
  return normalizeEmail(email)
}

export async function loadAdminProfile(uid: string): Promise<AdminProfile | null> {
  const snap = await getDoc(doc(getDb(), 'admins', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid,
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? ''),
    role: data.role as AdminRole,
    assignedRecipientIds: data.assignedRecipientIds,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

/**
 * Ensures `admins/{uid}` exists for bootstrap email or a pending invite.
 * Safe to call on every admin route visit.
 */
export async function ensureAdminClaim(): Promise<AdminProfile | null> {
  const user = getFirebaseAuth().currentUser
  if (!user?.email) return null

  const existing = await loadAdminProfile(user.uid)
  if (existing) return existing

  const email = normalizeEmail(user.email)
  const displayName = user.displayName?.trim() || email

  if (email === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
    await setDoc(doc(getDb(), 'admins', user.uid), {
      email,
      displayName,
      role: 'super_admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return loadAdminProfile(user.uid)
  }

  const inviteRef = doc(getDb(), 'adminInvites', inviteId(email))
  const inviteSnap = await getDoc(inviteRef)
  if (!inviteSnap.exists()) return null

  const role = (inviteSnap.data().role as AdminRole) || 'admin'
  await setDoc(doc(getDb(), 'admins', user.uid), {
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await deleteDoc(inviteRef)

  return loadAdminProfile(user.uid)
}
