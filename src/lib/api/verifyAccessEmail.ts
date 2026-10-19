import { FirebaseError } from 'firebase/app'
import { httpsCallable } from 'firebase/functions'

import { isFirebaseConfigured } from '@/lib/env'
import { getFirebaseFunctions } from '@/lib/firebase'

export type VerifyAccessResult = { allowed: boolean; email?: string }

export type VerifyAccessErrorCode =
  | 'invalid'
  | 'unavailable'
  | 'not_configured'
  | 'unauthenticated'
  | 'unknown'

export class VerifyAccessError extends Error {
  readonly code: VerifyAccessErrorCode

  constructor(code: VerifyAccessErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'VerifyAccessError'
    this.code = code
  }
}

async function verifyViaLocalDevApi(email: string): Promise<VerifyAccessResult> {
  const res = await fetch('/api/verify-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (res.status === 503) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    if (body?.error === 'peopleforce_not_configured') {
      throw new VerifyAccessError('not_configured')
    }
    throw new VerifyAccessError('unavailable')
  }

  if (!res.ok) {
    throw new VerifyAccessError('unavailable')
  }

  return (await res.json()) as VerifyAccessResult
}

async function verifyViaCallable(): Promise<VerifyAccessResult> {
  const callable = httpsCallable<{ email?: string }, VerifyAccessResult>(
    getFirebaseFunctions(),
    'verifyAccessEmail',
  )

  try {
    // Email is taken from the Firebase Auth token on the server.
    const result = await callable({})
    return result.data
  } catch (err) {
    if (err instanceof FirebaseError) {
      if (err.code === 'functions/unauthenticated') {
        throw new VerifyAccessError('unauthenticated')
      }
      if (err.code === 'functions/invalid-argument') {
        throw new VerifyAccessError('invalid')
      }
      if (err.code === 'functions/failed-precondition') {
        throw new VerifyAccessError('not_configured')
      }
      if (err.code === 'functions/unavailable' || err.code === 'functions/internal') {
        throw new VerifyAccessError('unavailable')
      }
    }
    throw new VerifyAccessError('unknown')
  }
}

/**
 * Checks PeopleForce for the signed-in (or provided) corporate email.
 * Dev: Vite `/api/verify-access`. Prod: authenticated Cloud Function.
 */
export async function verifyAccessEmail(email: string): Promise<VerifyAccessResult> {
  if (import.meta.env.DEV) {
    try {
      return await verifyViaLocalDevApi(email)
    } catch (err) {
      if (
        err instanceof VerifyAccessError &&
        err.code === 'not_configured' &&
        isFirebaseConfigured()
      ) {
        return verifyViaCallable()
      }
      throw err
    }
  }

  if (isFirebaseConfigured()) {
    return verifyViaCallable()
  }

  return verifyViaLocalDevApi(email)
}
