import {
  ALLOWED_EMAIL_DOMAIN,
  DEFAULT_RECIPIENTS,
  FEEDBACK_TYPES,
  LANGUAGES,
  MAX_EMAIL,
  MAX_MESSAGE,
  MAX_NAME,
  MAX_NICKNAME,
  MIN_MESSAGE,
  TOPIC_IDS,
  type AppLanguage,
  type FeedbackType,
  type TopicId,
} from './constants'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type SubmitFeedbackPayload = {
  type: FeedbackType
  name?: string
  nickname?: string
  email?: string
  topicId: TopicId
  message: string
  recipientId: string
  language: AppLanguage
  accessEmail: string
  website?: string
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function isAllowedCorporateEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at < 1 || at === normalized.length - 1) return false
  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)
  if (!local || local.includes(' ')) return false
  if (domain !== ALLOWED_EMAIL_DOMAIN) return false
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false
  return true
}

export function parseSubmitPayload(data: unknown): SubmitFeedbackPayload {
  if (!data || typeof data !== 'object') {
    throw new Error('invalid_payload')
  }

  const raw = data as Record<string, unknown>
  const type = asString(raw.type)
  const topicId = asString(raw.topicId)
  const recipientId = asString(raw.recipientId)
  const language = asString(raw.language)
  const message = asString(raw.message).trim()
  const website = asString(raw.website)
  const name = asString(raw.name).trim()
  const nickname = asString(raw.nickname).trim()
  const email = asString(raw.email).trim()
  const accessEmail = asString(raw.accessEmail).trim().toLowerCase()

  if (!isAllowedCorporateEmail(accessEmail)) {
    throw new Error('invalid_access_email')
  }
  if (!(FEEDBACK_TYPES as readonly string[]).includes(type)) {
    throw new Error('invalid_type')
  }
  if (!(TOPIC_IDS as readonly string[]).includes(topicId)) {
    throw new Error('invalid_topic')
  }
  if (!(recipientId in DEFAULT_RECIPIENTS)) {
    throw new Error('invalid_recipient')
  }
  if (!(LANGUAGES as readonly string[]).includes(language)) {
    throw new Error('invalid_language')
  }
  if (message.length < MIN_MESSAGE || message.length > MAX_MESSAGE) {
    throw new Error('invalid_message')
  }

  if (type === 'identified') {
    if (!name || name.length > MAX_NAME) {
      throw new Error('invalid_name')
    }
    if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
      throw new Error('invalid_email')
    }
    if (nickname.length > MAX_NICKNAME) {
      throw new Error('invalid_nickname')
    }
  }

  return {
    type: type as FeedbackType,
    topicId: topicId as TopicId,
    recipientId,
    language: language as AppLanguage,
    message,
    accessEmail,
    website: website || undefined,
    ...(type === 'identified'
      ? {
          name,
          email,
          ...(nickname ? { nickname } : {}),
        }
      : {}),
  }
}
