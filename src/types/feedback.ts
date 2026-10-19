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
  /** Gate email — must be @221e.space */
  accessEmail: string
  /** Author allows publishing the admin reply on the public reviews wall */
  allowPublicReply: boolean
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
  allowPublicReply?: boolean
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
  isPublic?: boolean
  topicId?: string
  createdAt: unknown
}
