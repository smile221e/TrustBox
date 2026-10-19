import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

import { BOOTSTRAP_SUPER_ADMIN_EMAIL } from '@/lib/admin-bootstrap'
import { normalizeEmail } from '@/lib/access'
import { getDb, getFirebaseAuth } from '@/lib/firebase'
import type { AdminRole } from '@/lib/constants'
import type { AdminProfile } from '@/types/admin'

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

async function resolveAllowlistedRole(email: string): Promise<AdminRole | null> {
  const emailRef = doc(getDb(), 'adminEmails', email)
  const emailSnap = await getDoc(emailRef)
  if (emailSnap.exists()) {
    return (emailSnap.data().role as AdminRole) || 'admin'
  }

  // Legacy collection from the old invite flow.
  const inviteRef = doc(getDb(), 'adminInvites', email)
  const inviteSnap = await getDoc(inviteRef)
  if (inviteSnap.exists()) {
    const role = (inviteSnap.data().role as AdminRole) || 'admin'
    // Promote legacy invite → permanent allowlist.
    await setDoc(emailRef, {
      email,
      role,
      addedByUid: 'migration',
      addedByEmail: email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return role
  }

  return null
}

/**
 * Ensures `admins/{uid}` exists for bootstrap / allowlisted emails.
 * Adding an email in Admin panel grants access immediately via `adminEmails`.
 */
export async function ensureAdminClaim(): Promise<AdminProfile | null> {
  const user = getFirebaseAuth().currentUser
  if (!user?.email) return null

  const existing = await loadAdminProfile(user.uid)
  if (existing) return existing

  const email = normalizeEmail(user.email)
  const displayName = user.displayName?.trim() || email

  const role: AdminRole | null =
    email === BOOTSTRAP_SUPER_ADMIN_EMAIL
      ? 'super_admin'
      : await resolveAllowlistedRole(email)

  if (email === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
    await setDoc(
      doc(getDb(), 'adminEmails', email),
      {
        email,
        role: 'super_admin',
        addedByUid: user.uid,
        addedByEmail: email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  if (!role) return null

  await setDoc(doc(getDb(), 'admins', user.uid), {
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return loadAdminProfile(user.uid)
}
