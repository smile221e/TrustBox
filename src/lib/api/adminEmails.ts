import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'

import { normalizeEmail } from '@/lib/access'
import { getDb, getFirebaseAuth } from '@/lib/firebase'
import type { AdminRole } from '@/lib/constants'

export type AdminListItem = {
  email: string
  role: AdminRole
  displayName?: string
  uid?: string
  /** Has signed in and claimed admins/{uid} */
  active: boolean
}

/** Immediately grants admin rights to this @221e.space mailbox. */
export async function addAdminByEmail(
  emailRaw: string,
  role: AdminRole = 'admin',
): Promise<void> {
  const user = getFirebaseAuth().currentUser
  if (!user?.email) throw new Error('unauthenticated')

  const email = normalizeEmail(emailRaw)
  if (!email.endsWith('@221e.space')) {
    throw new Error('invalid_domain')
  }

  await setDoc(doc(getDb(), 'adminEmails', email), {
    email,
    role,
    addedByUid: user.uid,
    addedByEmail: normalizeEmail(user.email),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function removeAdminByEmail(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw)
  await deleteDoc(doc(getDb(), 'adminEmails', email))

  // Also drop any claimed uid profile for this mailbox.
  const snap = await getDocs(query(collection(getDb(), 'admins'), where('email', '==', email)))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))

  // Legacy invite docs, if any.
  try {
    await deleteDoc(doc(getDb(), 'adminInvites', email))
  } catch {
    // ignore
  }
}

export async function listAdminDirectory(): Promise<AdminListItem[]> {
  const [emailSnap, uidSnap] = await Promise.all([
    getDocs(collection(getDb(), 'adminEmails')),
    getDocs(collection(getDb(), 'admins')),
  ])

  const byEmail = new Map<string, AdminListItem>()

  for (const d of emailSnap.docs) {
    const data = d.data()
    const email = normalizeEmail(String(data.email ?? d.id))
    byEmail.set(email, {
      email,
      role: (data.role as AdminRole) || 'admin',
      active: false,
    })
  }

  // Legacy pending invites still count as granted emails.
  try {
    const inviteSnap = await getDocs(collection(getDb(), 'adminInvites'))
    for (const d of inviteSnap.docs) {
      const data = d.data()
      const email = normalizeEmail(String(data.email ?? d.id))
      if (!byEmail.has(email)) {
        byEmail.set(email, {
          email,
          role: (data.role as AdminRole) || 'admin',
          active: false,
        })
      }
    }
  } catch {
    // ignore if rules block
  }

  for (const d of uidSnap.docs) {
    const data = d.data()
    const email = normalizeEmail(String(data.email ?? ''))
    if (!email) continue
    const existing = byEmail.get(email)
    byEmail.set(email, {
      email,
      role: (data.role as AdminRole) || existing?.role || 'admin',
      displayName: String(data.displayName ?? ''),
      uid: d.id,
      active: true,
    })
  }

  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email))
}
