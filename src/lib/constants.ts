export const STORAGE_KEYS = {
  theme: 'trustbox.theme',
  language: 'trustbox.language',
  /** Verified @221e.space email that unlocked the site */
  accessEmail: 'trustbox.accessEmail',
} as const

export const SUPPORTED_LANGUAGES = ['uk', 'en', 'es'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: AppLanguage = 'uk'

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

export const FEEDBACK_STATUSES = ['new', 'in_progress', 'closed'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export const FEEDBACK_TYPES = ['anonymous', 'identified'] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

export const ADMIN_ROLES = ['super_admin', 'admin'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export const DEFAULT_RECIPIENT_IDS = [
  'unspecified',
  'owner',
  'ceo',
  'hrd',
  'sfo',
  'tso',
  'cco',
  'cmo',
] as const
