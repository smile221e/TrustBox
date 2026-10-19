import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'

import { isEmployeeAllowed } from './peopleforce'
import { isAllowedCorporateEmail } from './validation'

/**
 * Authenticated callable: Google (Firebase Auth) session required.
 * Email is taken from the ID token — client cannot spoof another mailbox.
 */
export const verifyAccessEmail = onCall({ cors: true }, async (request) => {
  const tokenEmail = request.auth?.token?.email
  if (!request.auth || typeof tokenEmail !== 'string' || !tokenEmail) {
    throw new HttpsError('unauthenticated', 'unauthenticated')
  }

  const email = tokenEmail.trim().toLowerCase()

  if (!isAllowedCorporateEmail(email)) {
    return { allowed: false as const }
  }

  try {
    const allowed = await isEmployeeAllowed(email)
    if (!allowed) {
      return { allowed: false as const }
    }
    return { allowed: true as const, email }
  } catch (err) {
    const code = err instanceof Error ? err.message : 'peopleforce_unavailable'
    logger.error('verify_access_failed', { code })
    if (code === 'peopleforce_not_configured') {
      throw new HttpsError('failed-precondition', 'peopleforce_not_configured')
    }
    throw new HttpsError('unavailable', 'peopleforce_unavailable')
  }
})
