import { createHash } from 'node:crypto'

import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'

import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from './constants'

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

/**
 * Simple sliding-window rate limit keyed by hashed IP.
 * Uses Admin SDK (bypasses security rules).
 */
export async function assertWithinRateLimit(ip: string): Promise<void> {
  const db = getFirestore()
  const key = hashIp(ip || 'unknown')
  const ref = db.collection('rateLimits').doc(key)
  const now = Date.now()

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() as
      | { count?: number; windowStartMs?: number }
      | undefined

    const windowStartMs = data?.windowStartMs ?? now
    const elapsed = now - windowStartMs
    const inWindow = elapsed < RATE_LIMIT_WINDOW_MS
    const count = inWindow ? (data?.count ?? 0) : 0

    if (inWindow && count >= RATE_LIMIT_MAX) {
      throw new Error('rate_limited')
    }

    tx.set(
      ref,
      {
        count: count + 1,
        windowStartMs: inWindow ? windowStartMs : now,
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(
          (inWindow ? windowStartMs : now) + RATE_LIMIT_WINDOW_MS,
        ),
      },
      { merge: true },
    )
  })
}
