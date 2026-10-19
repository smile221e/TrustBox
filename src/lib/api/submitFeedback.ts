import { FirebaseError } from 'firebase/app'
import { httpsCallable } from 'firebase/functions'

import { isFirebaseConfigured } from '@/lib/env'
import { getFirebaseFunctions } from '@/lib/firebase'
import type { FeedbackSubmissionInput } from '@/types/feedback'

export type SubmitFeedbackResult = { id: string }

export type SubmitFeedbackErrorCode =
  | 'not_configured'
  | 'rate_limited'
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

function mapFunctionsError(err: unknown): SubmitFeedbackError {
  if (err instanceof FirebaseError) {
    if (err.code === 'functions/unauthenticated') {
      return new SubmitFeedbackError('unauthenticated')
    }
    if (err.code === 'functions/resource-exhausted') {
      return new SubmitFeedbackError('rate_limited')
    }
    if (err.code === 'functions/invalid-argument') {
      return new SubmitFeedbackError('invalid')
    }
    if (
      err.code === 'functions/unavailable' ||
      err.code === 'functions/deadline-exceeded' ||
      err.code === 'functions/internal'
    ) {
      return new SubmitFeedbackError('unavailable')
    }
  }

  return new SubmitFeedbackError('unknown')
}

/** Calls the Stage 04 `submitFeedback` callable. */
export async function submitFeedback(
  input: FeedbackSubmissionInput,
): Promise<SubmitFeedbackResult> {
  if (!isFirebaseConfigured()) {
    throw new SubmitFeedbackError('not_configured')
  }

  const callable = httpsCallable<FeedbackSubmissionInput, SubmitFeedbackResult>(
    getFirebaseFunctions(),
    'submitFeedback',
  )

  try {
    const result = await callable(input)
    if (!result.data?.id) {
      throw new SubmitFeedbackError('unknown')
    }
    return result.data
  } catch (err) {
    if (err instanceof SubmitFeedbackError) throw err
    throw mapFunctionsError(err)
  }
}
