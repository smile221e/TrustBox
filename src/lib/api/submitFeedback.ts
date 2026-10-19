import { FirebaseError } from 'firebase/app'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import { isFirebaseConfigured } from '@/lib/env'
import { getDb, getFirebaseAuth } from '@/lib/firebase'
import { getRecipient } from '@/lib/api/recipients'
import { notifyRecipientOfFeedback } from '@/lib/api/notifyRecipient'
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

/** Writes feedback to Firestore and best-effort notifies the recipient by email. */
export async function submitFeedback(
  input: FeedbackSubmissionInput,
  topicLabel?: string,
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
  const recipientName = input.recipientName.trim() || input.recipientId

  try {
    const ref = await addDoc(collection(getDb(), 'feedback'), {
      type: input.type,
      name: isIdentified ? input.name ?? null : null,
      nickname: isIdentified ? input.nickname ?? null : null,
      email: isIdentified ? accessEmail : null,
      topicId: input.topicId,
      message: input.message,
      recipientId: input.recipientId,
      recipientName,
      status: 'new',
      language: input.language,
      accessEmail,
      allowPublicReply: Boolean(input.allowPublicReply),
      heartCount: 0,
      commentCount: 0,
      createdByUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    try {
      const recipient = await getRecipient(input.recipientId)
      if (recipient?.email) {
        await notifyRecipientOfFeedback({
          to: recipient.email,
          recipientName,
          feedback: { ...input, email: isIdentified ? accessEmail : input.email },
          topicLabel: topicLabel ?? input.topicId,
          feedbackId: ref.id,
        })
      }
    } catch {
      // Notify is best-effort — do not fail the submission.
    }

    return { id: ref.id }
  } catch (err) {
    throw mapFirestoreError(err)
  }
}
