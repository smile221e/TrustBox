import type { AppLanguage, FeedbackStatus, FeedbackType, TopicId } from '@/lib/constants'

export interface FeedbackSubmissionInput {
  type: FeedbackType
  name?: string
  nickname?: string
  email?: string
  topicId: TopicId
  message: string
  recipientId: string
  language: AppLanguage
  /** Gate email — must be @221e.space (enforced client + Functions) */
  accessEmail: string
  /** Honeypot field — must stay empty */
  website?: string
}

export interface FeedbackDocument {
  id: string
  type: FeedbackType
  name: string | null
  nickname: string | null
  email: string | null
  topicId: TopicId
  message: string
  recipientId: string
  recipientName: string
  status: FeedbackStatus
  language: AppLanguage
  createdAt: unknown
  updatedAt: unknown
}

export interface FeedbackReply {
  id: string
  feedbackId: string
  body: string
  sentByAdminId: string
  sentByEmail: string
  deliveryStatus: 'queued' | 'accepted' | 'failed'
  createdAt: unknown
}
