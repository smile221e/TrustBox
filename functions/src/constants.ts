export const TOPIC_IDS = [
  'manager_communication',
  'salary',
  'work_conditions',
  'team',
  'learning',
  'ideas',
  'ethics',
  'thanks',
  'other',
] as const

export type TopicId = (typeof TOPIC_IDS)[number]

export const FEEDBACK_TYPES = ['anonymous', 'identified'] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

export const LANGUAGES = ['uk', 'en', 'es'] as const
export type AppLanguage = (typeof LANGUAGES)[number]

export const DEFAULT_RECIPIENTS: Record<string, { name: string }> = {
  unspecified: { name: 'Unspecified' },
  owner: { name: 'Owner' },
  ceo: { name: 'CEO' },
  hrd: { name: 'HR Director' },
  sfo: { name: 'Security / Compliance' },
  tso: { name: 'Tech / Operations' },
  cco: { name: 'Customer / Commercial' },
  cmo: { name: 'Marketing / Communications' },
}

export const MIN_MESSAGE = 20
export const MAX_MESSAGE = 4000
export const MAX_NAME = 120
export const MAX_NICKNAME = 80
export const MAX_EMAIL = 254

/** Corporate domain required to unlock the app and call submitFeedback. */
export const ALLOWED_EMAIL_DOMAIN = '221e.space'

/** Max submissions per IP within the window. */
export const RATE_LIMIT_MAX = 5
/** Sliding window length in milliseconds (1 hour). */
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
