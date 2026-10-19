import {
  DEFAULT_RECIPIENT_IDS,
  FEEDBACK_TYPES,
  TOPIC_IDS,
  type FeedbackType,
  type TopicId,
} from '@/lib/constants'
import type { FeedbackSubmissionInput } from '@/types/feedback'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_MESSAGE = 20
const MAX_MESSAGE = 4000

export type FeedbackFormValues = {
  type: FeedbackType
  topicId: TopicId | ''
  recipientId: string
  name: string
  nickname: string
  email: string
  message: string
  /** Allow publishing the admin reply on the site reviews section */
  allowPublicReply: boolean
  /** Honeypot — bots fill this; humans must leave empty */
  website: string
}

export type FeedbackFieldErrors = Partial<Record<keyof FeedbackFormValues, string>>

export const INITIAL_FEEDBACK_VALUES: FeedbackFormValues = {
  type: 'anonymous',
  topicId: '',
  recipientId: DEFAULT_RECIPIENT_IDS[0],
  name: '',
  nickname: '',
  email: '',
  message: '',
  allowPublicReply: false,
  website: '',
}

export function isTopicId(value: string): value is TopicId {
  return (TOPIC_IDS as readonly string[]).includes(value)
}

export function isFeedbackType(value: string): value is FeedbackType {
  return (FEEDBACK_TYPES as readonly string[]).includes(value)
}

export function isRecipientId(value: string): boolean {
  return (DEFAULT_RECIPIENT_IDS as readonly string[]).includes(value)
}

export function validateStepOne(values: FeedbackFormValues): FeedbackFieldErrors {
  const errors: FeedbackFieldErrors = {}

  if (!isFeedbackType(values.type)) {
    errors.type = 'form.errors.type'
  }
  if (!values.topicId || !isTopicId(values.topicId)) {
    errors.topicId = 'form.errors.topic'
  }
  if (!values.recipientId || !isRecipientId(values.recipientId)) {
    errors.recipientId = 'form.errors.recipient'
  }

  return errors
}

export function validateStepTwo(values: FeedbackFormValues): FeedbackFieldErrors {
  const errors: FeedbackFieldErrors = {}
  const message = values.message.trim()

  if (message.length < MIN_MESSAGE) {
    errors.message = 'form.errors.messageShort'
  } else if (message.length > MAX_MESSAGE) {
    errors.message = 'form.errors.messageLong'
  }

  if (values.type === 'identified') {
    if (!values.name.trim()) {
      errors.name = 'form.errors.name'
    }
    if (!values.email.trim()) {
      errors.email = 'form.errors.emailRequired'
    } else if (!EMAIL_RE.test(values.email.trim())) {
      errors.email = 'form.errors.emailInvalid'
    }
  }

  return errors
}

/** Build the payload for Firestore feedback submit. */
export function toSubmissionInput(
  values: FeedbackFormValues,
  language: FeedbackSubmissionInput['language'],
  accessEmail: string,
): FeedbackSubmissionInput | null {
  if (!isTopicId(values.topicId) || !isRecipientId(values.recipientId)) {
    return null
  }

  const base: FeedbackSubmissionInput = {
    type: values.type,
    topicId: values.topicId,
    message: values.message.trim(),
    recipientId: values.recipientId,
    language,
    accessEmail,
    allowPublicReply: values.allowPublicReply,
    website: values.website,
  }

  if (values.type === 'identified') {
    return {
      ...base,
      name: values.name.trim(),
      nickname: values.nickname.trim() || undefined,
      email: values.email.trim(),
    }
  }

  return base
}

export { MIN_MESSAGE, MAX_MESSAGE }
