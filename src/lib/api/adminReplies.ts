import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore'

import { getDb, getFirebaseAuth } from '@/lib/firebase'
import type { FeedbackReply } from '@/types/feedback'

export type AdminReplyDoc = FeedbackReply & {
  isPublic: boolean
  topicId?: string
}

function mapReply(id: string, data: Record<string, unknown>): AdminReplyDoc {
  return {
    id,
    feedbackId: String(data.feedbackId ?? ''),
    body: String(data.body ?? ''),
    sentByAdminId: String(data.sentByAdminId ?? ''),
    sentByEmail: String(data.sentByEmail ?? ''),
    deliveryStatus: (data.deliveryStatus as FeedbackReply['deliveryStatus']) ?? 'accepted',
    isPublic: Boolean(data.isPublic),
    topicId: data.topicId as string | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
  }
}

export async function listRepliesForFeedback(feedbackId: string): Promise<AdminReplyDoc[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'feedbackReplies'),
      where('feedbackId', '==', feedbackId),
      orderBy('createdAt', 'asc'),
    ),
  )
  return snap.docs.map((d) => mapReply(d.id, d.data()))
}

export async function createReply(input: {
  feedbackId: string
  body: string
  isPublic: boolean
  topicId: string
}): Promise<string> {
  const user = getFirebaseAuth().currentUser
  if (!user?.email) throw new Error('unauthenticated')

  const ref = await addDoc(collection(getDb(), 'feedbackReplies'), {
    feedbackId: input.feedbackId,
    body: input.body.trim(),
    sentByAdminId: user.uid,
    sentByEmail: user.email.trim().toLowerCase(),
    deliveryStatus: 'accepted',
    isPublic: input.isPublic,
    topicId: input.topicId,
    createdAt: serverTimestamp(),
  })

  return ref.id
}

export async function listPublicReviews(limitCount = 40): Promise<AdminReplyDoc[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), 'feedbackReplies'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
    ),
  )
  return snap.docs.slice(0, limitCount).map((d) => mapReply(d.id, d.data()))
}
