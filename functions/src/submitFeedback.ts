import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'

import { isEmployeeAllowed } from './peopleforce'
import { assertWithinRateLimit } from './rateLimit'
import { resolveRecipient } from './recipients'
import { parseSubmitPayload } from './validation'

function clientIp(rawRequest: { ip?: string; headers?: Record<string, unknown> }): string {
  const forwarded = rawRequest.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  return rawRequest.ip || 'unknown'
}

function toHttpsError(code: string): HttpsError {
  switch (code) {
    case 'rate_limited':
      return new HttpsError('resource-exhausted', 'rate_limited')
    case 'recipient_inactive':
      return new HttpsError('failed-precondition', 'recipient_inactive')
    case 'invalid_payload':
    case 'invalid_access_email':
    case 'invalid_type':
    case 'invalid_topic':
    case 'invalid_recipient':
    case 'invalid_language':
    case 'invalid_message':
    case 'invalid_name':
    case 'invalid_email':
    case 'invalid_nickname':
      return new HttpsError('invalid-argument', code)
    case 'peopleforce_not_configured':
      return new HttpsError('failed-precondition', code)
    case 'peopleforce_unavailable':
      return new HttpsError('unavailable', code)
    default:
      return new HttpsError('internal', 'submit_failed')
  }
}

/**
 * Public callable: validate → honeypot → rate limit → write feedback.
 * Never echoes recipient emails or rate-limit internals.
 */
export const submitFeedback = onCall({ cors: true }, async (request) => {
  const tokenEmail = request.auth?.token?.email
  if (!request.auth || typeof tokenEmail !== 'string' || !tokenEmail) {
    throw new HttpsError('unauthenticated', 'unauthenticated')
  }

  const authEmail = tokenEmail.trim().toLowerCase()

  const raw = request.data as { website?: string } | null

  // Honeypot: pretend success, write nothing.
  if (typeof raw?.website === 'string' && raw.website.trim().length > 0) {
    logger.info('honeypot_triggered')
    return { id: 'accepted' }
  }

  // Force accessEmail from the verified Google session — ignore client spoofing.
  const dataWithAuthEmail = {
    ...(request.data as Record<string, unknown>),
    accessEmail: authEmail,
  }

  let payload
  try {
    payload = parseSubmitPayload(dataWithAuthEmail)
  } catch (err) {
    throw toHttpsError(err instanceof Error ? err.message : 'invalid_payload')
  }

  try {
    const employeeOk = await isEmployeeAllowed(authEmail)
    if (!employeeOk) {
      throw new HttpsError('permission-denied', 'access_denied')
    }
  } catch (err) {
    if (err instanceof HttpsError) throw err
    throw toHttpsError(err instanceof Error ? err.message : 'peopleforce_unavailable')
  }

  const ip = clientIp(request.rawRequest)

  try {
    await assertWithinRateLimit(ip)
  } catch (err) {
    throw toHttpsError(err instanceof Error ? err.message : 'rate_limited')
  }

  let recipient
  try {
    recipient = await resolveRecipient(payload.recipientId)
  } catch (err) {
    throw toHttpsError(err instanceof Error ? err.message : 'invalid_recipient')
  }

  const db = getFirestore()
  const docRef = db.collection('feedback').doc()

  const isIdentified = payload.type === 'identified'

  await docRef.set({
    type: payload.type,
    name: isIdentified ? payload.name ?? null : null,
    nickname: isIdentified ? payload.nickname ?? null : null,
    email: isIdentified ? payload.email ?? null : null,
    topicId: payload.topicId,
    message: payload.message,
    recipientId: recipient.id,
    recipientName: recipient.name,
    // Kept for Stage 06 notify — never exposed via client reads in Stage 04
    recipientEmail: recipient.email,
    status: 'new',
    language: payload.language,
    accessEmail: payload.accessEmail,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  logger.info('feedback_created', { id: docRef.id, topicId: payload.topicId })

  return { id: docRef.id }
})
