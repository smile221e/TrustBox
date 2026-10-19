import { FirebaseError } from 'firebase/app'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import { DEFAULT_RECIPIENT_IDS } from '@/lib/constants'
import { isFirebaseConfigured } from '@/lib/env'
import { getDb, getFirebaseAuth } from '@/lib/firebase'
import type { FeedbackSubmissionInput } from '@/types/feedback'

export type SubmitFeedbackResult = { id: string }

export type SubmitFeedbackErrorCode =
  | 'not_configured'
  | 'invalid'
  | 'unavailable'
  | 'unauthenticated'
  | 'unknown'

export class SubmitFeedbackError extends Error {
  readonly code: SubmitFeedbackErrorCode

  constructor(code: SubmitFeedbackErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'SubmitFeedbackError'
    this.code = code
  }
}

const RECIPIENT_NAMES: Record<(typeof DEFAULT_RECIPIENT_IDS)[number], string> = {
  unspecified: 'Unspecified',
  owner: 'Owner',
  ceo: 'CEO',
  hrd: 'HR Director',
  sfo: 'Security / Compliance',
  tso: 'Tech / Operations',
  cco: 'Customer / Commercial',
  cmo: 'Marketing / Communications',
}

function mapFirestoreError(err: unknown): SubmitFeedbackError {
  if (err instanceof FirebaseError) {
    if (err.code === 'permission-denied') {
      return new SubmitFeedbackError('unauthenticated')
    }
    if (err.code === 'invalid-argument') {
      return new SubmitFeedbackError('invalid')
    }
    if (err.code === 'unavailable') {
      return new SubmitFeedbackError('unavailable')
    }
  }
  return new SubmitFeedbackError('unknown')
}

/** Writes feedback to Firestore (Spark-friendly — no Cloud Functions). */
export async function submitFeedback(
  input: FeedbackSubmissionInput,
): Promise<SubmitFeedbackResult> {
  if (!isFirebaseConfigured()) {
    throw new SubmitFeedbackError('not_configured')
  }

  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user?.email) {
    throw new SubmitFeedbackError('unauthenticated')
  }

  // Honeypot — pretend success, write nothing
  if (input.website?.trim()) {
    return { id: 'accepted' }
  }

  const accessEmail = user.email.trim().toLowerCase()
  const isIdentified = input.type === 'identified'
  const recipientName =
    RECIPIENT_NAMES[input.recipientId as keyof typeof RECIPIENT_NAMES] ?? input.recipientId

  try {
    const ref = await addDoc(collection(getDb(), 'feedback'), {
      type: input.type,
      name: isIdentified ? input.name ?? null : null,
      nickname: isIdentified ? input.nickname ?? null : null,
      email: isIdentified ? input.email ?? null : null,
      topicId: input.topicId,
      message: input.message,
      recipientId: input.recipientId,
      recipientName,
      status: 'new',
      language: input.language,
      accessEmail,
      allowPublicReply: Boolean(input.allowPublicReply),
      createdByUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return { id: ref.id }
  } catch (err) {
    throw mapFirestoreError(err)
  }
}
