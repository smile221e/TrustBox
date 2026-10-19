import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import { normalizeEmail } from '@/lib/access'
import { getDb, getFirebaseAuth } from '@/lib/firebase'
import type { AdminRole } from '@/lib/constants'

export type AdminInvite = {
  email: string
  role: AdminRole
  invitedByUid: string
  invitedByEmail: string
  createdAt: unknown
}

export async function listAdminInvites(): Promise<AdminInvite[]> {
  const snap = await getDocs(collection(getDb(), 'adminInvites'))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      email: String(data.email ?? d.id),
      role: (data.role as AdminRole) || 'admin',
      invitedByUid: String(data.invitedByUid ?? ''),
      invitedByEmail: String(data.invitedByEmail ?? ''),
      createdAt: data.createdAt,
    }
  })
}

export async function listAdmins(): Promise<
  Array<{ uid: string; email: string; displayName: string; role: AdminRole }>
> {
  const snap = await getDocs(collection(getDb(), 'admins'))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      uid: d.id,
      email: String(data.email ?? ''),
      displayName: String(data.displayName ?? ''),
      role: data.role as AdminRole,
    }
  })
}

export async function inviteAdmin(emailRaw: string, role: AdminRole = 'admin'): Promise<void> {
  const user = getFirebaseAuth().currentUser
  if (!user?.email) throw new Error('unauthenticated')

  const email = normalizeEmail(emailRaw)
  if (!email.endsWith('@221e.space')) {
    throw new Error('invalid_domain')
  }

  await setDoc(doc(getDb(), 'adminInvites', email), {
    email,
    role,
    invitedByUid: user.uid,
    invitedByEmail: normalizeEmail(user.email),
    createdAt: serverTimestamp(),
  })
}

export async function revokeInvite(emailRaw: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'adminInvites', normalizeEmail(emailRaw)))
}
