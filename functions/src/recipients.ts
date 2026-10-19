import { getFirestore } from 'firebase-admin/firestore'

import { DEFAULT_RECIPIENTS } from './constants'

export type ResolvedRecipient = {
  id: string
  name: string
  email: string | null
}

/**
 * Resolve recipient from Firestore when present; fall back to built-in defaults.
 * Email is never returned to the client — used later for Stage 06 notify.
 */
export async function resolveRecipient(recipientId: string): Promise<ResolvedRecipient> {
  const fallback = DEFAULT_RECIPIENTS[recipientId]
  if (!fallback) {
    throw new Error('invalid_recipient')
  }

  const snap = await getFirestore().collection('recipients').doc(recipientId).get()
  if (!snap.exists) {
    return { id: recipientId, name: fallback.name, email: null }
  }

  const data = snap.data() as {
    name?: string
    email?: string
    isActive?: boolean
  }

  if (data.isActive === false) {
    throw new Error('recipient_inactive')
  }

  return {
    id: recipientId,
    name: data.name?.trim() || fallback.name,
    email: data.email?.trim() || null,
  }
}
