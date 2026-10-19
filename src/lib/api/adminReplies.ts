import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore'

import { getDb, getFirebaseAuth } from '@/lib/firebase'
import type { FeedbackStatus, FeedbackType } from '@/lib/constants'
import type { FeedbackReply } from '@/types/feedback'

export type AdminReplyDoc = FeedbackReply & {
  isPublic: boolean
  topicId?: string
  questionText?: string
  authorKind?: FeedbackType
  authorName?: string | null
  feedbackStatus?: FeedbackStatus
  adminDisplayName?: string
  upvoteCount?: number
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
    questionText: data.questionText as string | undefined,
    authorKind: data.authorKind as FeedbackType | undefined,
    authorName: (data.authorName as string | null | undefined) ?? null,
    feedbackStatus: data.feedbackStatus as FeedbackStatus | undefined,
    adminDisplayName: data.adminDisplayName as string | undefined,
    upvoteCount: typeof data.upvoteCount === 'number' ? data.upvoteCount : 0,
    createdAt: data.createdAt as Timestamp | undefined,
  }
}

function createdAtMs(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return (value as Timestamp).toMillis()
  }
  return 0
}

function voteDocId(replyId: string, uid: string) {
  return `${replyId}_${uid}`
}

export async function listRepliesForFeedback(feedbackId: string): Promise<AdminReplyDoc[]> {
  const snap = await getDocs(
    query(collection(getDb(), 'feedbackReplies'), where('feedbackId', '==', feedbackId)),
  )
  return snap.docs
    .map((d) => mapReply(d.id, d.data()))
    .sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt))
}

export async function createReply(input: {
  feedbackId: string
  body: string
  isPublic: boolean
  topicId: string
  questionText: string
  authorKind: FeedbackType
  authorName: string | null
  feedbackStatus: FeedbackStatus
}): Promise<string> {
  const user = getFirebaseAuth().currentUser
  if (!user?.email) throw new Error('unauthenticated')

  const adminDisplayName =
    user.displayName?.trim() || user.email.trim().toLowerCase().split('@')[0] || 'Admin'

  const ref = await addDoc(collection(getDb(), 'feedbackReplies'), {
    feedbackId: input.feedbackId,
    body: input.body.trim(),
    sentByAdminId: user.uid,
    sentByEmail: user.email.trim().toLowerCase(),
    deliveryStatus: 'accepted',
    isPublic: input.isPublic,
    topicId: input.topicId,
    questionText: input.questionText.trim().slice(0, 4000),
    authorKind: input.authorKind,
    authorName: input.authorKind === 'identified' ? input.authorName : null,
    feedbackStatus: input.feedbackStatus,
    adminDisplayName,
    upvoteCount: 0,
    createdAt: serverTimestamp(),
  })

  return ref.id
}

export async function listPublicReviews(limitCount = 40): Promise<AdminReplyDoc[]> {
  const snap = await getDocs(
    query(collection(getDb(), 'feedbackReplies'), where('isPublic', '==', true)),
  )
  return snap.docs
    .map((d) => mapReply(d.id, d.data()))
    .sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt))
    .slice(0, limitCount)
}

export async function listRecentReplies(limitCount = 40): Promise<AdminReplyDoc[]> {
  const snap = await getDocs(
    query(collection(getDb(), 'feedbackReplies'), orderBy('createdAt', 'desc')),
  )
  return snap.docs.slice(0, limitCount).map((d) => mapReply(d.id, d.data()))
}

export async function hasUserUpvoted(replyId: string): Promise<boolean> {
  const user = getFirebaseAuth().currentUser
  if (!user) return false
  const snap = await getDoc(doc(getDb(), 'replyVotes', voteDocId(replyId, user.uid)))
  return snap.exists()
}

/** Toggle upvote for the current user. Returns the new count and voted state. */
export async function toggleReplyUpvote(
  replyId: string,
): Promise<{ upvoteCount: number; voted: boolean }> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('unauthenticated')

  const db = getDb()
  const replyRef = doc(db, 'feedbackReplies', replyId)
  const voteRef = doc(db, 'replyVotes', voteDocId(replyId, user.uid))

  return runTransaction(db, async (tx) => {
    const voteSnap = await tx.get(voteRef)
    const replySnap = await tx.get(replyRef)
    if (!replySnap.exists()) throw new Error('not_found')

    const current = Number(replySnap.data().upvoteCount ?? 0)
    if (voteSnap.exists()) {
      tx.delete(voteRef)
      tx.update(replyRef, { upvoteCount: increment(-1) })
      return { upvoteCount: Math.max(0, current - 1), voted: false }
    }

    tx.set(voteRef, {
      replyId,
      uid: user.uid,
      createdAt: serverTimestamp(),
    })
    tx.update(replyRef, { upvoteCount: increment(1) })
    return { upvoteCount: current + 1, voted: true }
  })
}

export async function listMyUpvotedReplyIds(replyIds: string[]): Promise<Set<string>> {
  const user = getFirebaseAuth().currentUser
  const voted = new Set<string>()
  if (!user || replyIds.length === 0) return voted

  await Promise.all(
    replyIds.map(async (id) => {
      const snap = await getDoc(doc(getDb(), 'replyVotes', voteDocId(id, user.uid)))
      if (snap.exists()) voted.add(id)
    }),
  )
  return voted
}
