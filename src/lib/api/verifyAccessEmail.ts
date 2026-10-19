import { FirebaseError } from 'firebase/app'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { isAllowedCorporateEmail, normalizeEmail } from '@/lib/access'
import { isFirebaseConfigured } from '@/lib/env'
import { getDb, getFirebaseFunctions } from '@/lib/firebase'

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

  const result = await callable({})
  return result.data
}

/** Firestore allowlist doc id = lowercase email. Written by seed script / Console. */
async function verifyViaFirestore(email: string): Promise<VerifyAccessResult> {
  const snap = await getDoc(doc(getDb(), 'accessAllowlist', email))
  if (!snap.exists()) {
    return { allowed: false }
  }
  const data = snap.data() as { allowed?: boolean }
  if (data.allowed === false) {
    return { allowed: false }
  }
  return { allowed: true, email }
}

function mapCallableError(err: unknown): VerifyAccessError {
  if (err instanceof FirebaseError) {
    if (err.code === 'functions/unauthenticated') {
      return new VerifyAccessError('unauthenticated')
    }
    if (err.code === 'functions/invalid-argument') {
      return new VerifyAccessError('invalid')
    }
    if (err.code === 'functions/failed-precondition') {
      return new VerifyAccessError('not_configured')
    }
    if (
      err.code === 'functions/unavailable' ||
      err.code === 'functions/internal' ||
      err.code === 'functions/not-found'
    ) {
      return new VerifyAccessError('unavailable')
    }
  }
  return new VerifyAccessError('unknown')
}

function isBackendMissing(err: unknown): boolean {
  return (
    err instanceof FirebaseError &&
    (err.code === 'functions/not-found' ||
      err.code === 'functions/unavailable' ||
      err.code === 'functions/internal')
  )
}

/**
 * 1) Dev: Vite PeopleForce proxy
 * 2) Prod: Cloud Function (live PeopleForce)
 * 3) Fallback: Firestore `accessAllowlist/{email}`
 * 4) Optional: `VITE_ALLOW_DOMAIN_FALLBACK=true` → allow any @221e.space Google user
 */
export async function verifyAccessEmail(email: string): Promise<VerifyAccessResult> {
  const normalized = normalizeEmail(email)

  if (import.meta.env.DEV) {
    try {
      return await verifyViaLocalDevApi(normalized)
    } catch (err) {
      if (
        err instanceof VerifyAccessError &&
        err.code === 'not_configured' &&
        isFirebaseConfigured()
      ) {
        // continue to prod-style checks below
      } else {
        throw err
      }
    }
  }

  if (!isFirebaseConfigured()) {
    return verifyViaLocalDevApi(normalized)
  }

  try {
    return await verifyViaCallable()
  } catch (callableErr) {
    if (!isBackendMissing(callableErr)) {
      throw mapCallableError(callableErr)
    }

    // Cloud Functions not deployed yet — try Firestore allowlist, then domain fallback.
    try {
      const fromStore = await verifyViaFirestore(normalized)
      if (fromStore.allowed) {
        return fromStore
      }
    } catch {
      // Firestore may be missing / rules not deployed yet
    }

    if (import.meta.env.VITE_ALLOW_DOMAIN_FALLBACK === 'true') {
      console.warn(
        '[TrustBox] Cloud Functions missing — temporary @221e.space domain fallback is ON',
      )
      return {
        allowed: isAllowedCorporateEmail(normalized),
        email: isAllowedCorporateEmail(normalized) ? normalized : undefined,
      }
    }

    throw new VerifyAccessError('not_configured')
  }
}
