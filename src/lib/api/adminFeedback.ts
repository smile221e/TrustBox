import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore'

import { getDb } from '@/lib/firebase'
import type { FeedbackStatus, FeedbackType, TopicId, AppLanguage } from '@/lib/constants'
import type { FeedbackDocument } from '@/types/feedback'

export type AdminFeedbackDoc = FeedbackDocument & {
  accessEmail?: string
  allowPublicReply: boolean
  createdByUid?: string
}

function mapFeedback(id: string, data: Record<string, unknown>): AdminFeedbackDoc {
  return {
    id,
    type: data.type as FeedbackType,
    name: (data.name as string | null) ?? null,
    nickname: (data.nickname as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    topicId: data.topicId as TopicId,
    message: String(data.message ?? ''),
    recipientId: String(data.recipientId ?? ''),
    recipientName: String(data.recipientName ?? ''),
    status: data.status as FeedbackStatus,
    language: data.language as AppLanguage,
    accessEmail: data.accessEmail as string | undefined,
    allowPublicReply: Boolean(data.allowPublicReply),
    createdByUid: data.createdByUid as string | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  }
}

export async function listFeedback(): Promise<AdminFeedbackDoc[]> {
  const snap = await getDocs(query(collection(getDb(), 'feedback'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => mapFeedback(d.id, d.data()))
}

export async function getFeedback(id: string): Promise<AdminFeedbackDoc | null> {
  const snap = await getDoc(doc(getDb(), 'feedback', id))
  if (!snap.exists()) return null
  return mapFeedback(snap.id, snap.data())
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  await updateDoc(doc(getDb(), 'feedback', id), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export function formatFeedbackDate(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value as Timestamp).toDate().toLocaleString()
  }
  return '—'
}
