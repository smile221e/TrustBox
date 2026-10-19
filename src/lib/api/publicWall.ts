import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore'

import { getDb, getFirebaseAuth } from '@/lib/firebase'
import type { FeedbackStatus, FeedbackType, TopicId } from '@/lib/constants'

export type PublicAnswer = {
  id: string
  body: string
  adminDisplayName: string
  createdAt: unknown
  parentCommentId: string | null
}

export type PublicThread = {
  id: string
  question: string
  topicId: TopicId | string
  status: FeedbackStatus
  authorKind: FeedbackType
  authorName: string | null
  heartCount: number
  commentCount: number
  createdAt: unknown
  /** Top-level public admin replies (not tied to a comment). */
  answers: PublicAnswer[]
  /** Public admin replies nested under a public comment. */
  commentReplies: PublicAnswer[]
}

export type PublicComment = {
  id: string
  feedbackId: string
  name: string
  email: string
  body: string
  createdAt: unknown
}

function createdAtMs(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return (value as Timestamp).toMillis()
  }
  return 0
}

function heartDocId(feedbackId: string, uid: string) {
  return `${feedbackId}_${uid}`
}

export async function listPublicThreads(limitCount = 50): Promise<PublicThread[]> {
  const [feedbackSnap, repliesSnap] = await Promise.all([
    getDocs(query(collection(getDb(), 'feedback'), where('allowPublicReply', '==', true))),
    getDocs(query(collection(getDb(), 'feedbackReplies'), where('isPublic', '==', true))),
  ])

  const answersByFeedback = new Map<string, PublicAnswer[]>()
  const commentRepliesByFeedback = new Map<string, PublicAnswer[]>()
  for (const d of repliesSnap.docs) {
    const data = d.data()
    const feedbackId = String(data.feedbackId ?? '')
    if (!feedbackId) continue
    const parentRaw = data.parentCommentId
    const parentCommentId =
      typeof parentRaw === 'string' && parentRaw.trim().length > 0 ? parentRaw.trim() : null
    const next: PublicAnswer = {
      id: d.id,
      body: String(data.body ?? ''),
      adminDisplayName: String(data.adminDisplayName ?? 'Admin'),
      createdAt: data.createdAt,
      parentCommentId,
    }
    if (parentCommentId) {
      const list = commentRepliesByFeedback.get(feedbackId) ?? []
      list.push(next)
      commentRepliesByFeedback.set(feedbackId, list)
    } else {
      const list = answersByFeedback.get(feedbackId) ?? []
      list.push(next)
      answersByFeedback.set(feedbackId, list)
    }
  }

  for (const list of answersByFeedback.values()) {
    list.sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt))
  }
  for (const list of commentRepliesByFeedback.values()) {
    list.sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt))
  }

  const threads: PublicThread[] = feedbackSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      question: String(data.message ?? ''),
      topicId: String(data.topicId ?? ''),
      status: (data.status as FeedbackStatus) || 'new',
      authorKind: (data.type as FeedbackType) || 'anonymous',
      authorName: (data.name as string | null) ?? null,
      heartCount: typeof data.heartCount === 'number' ? data.heartCount : 0,
      commentCount: typeof data.commentCount === 'number' ? data.commentCount : 0,
      createdAt: data.createdAt,
      answers: answersByFeedback.get(d.id) ?? [],
      commentReplies: commentRepliesByFeedback.get(d.id) ?? [],
    }
  })

  return threads
    .sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt))
    .slice(0, limitCount)
}

export async function listMyHeartedIds(feedbackIds: string[]): Promise<Set<string>> {
  const user = getFirebaseAuth().currentUser
  const hearted = new Set<string>()
  if (!user || feedbackIds.length === 0) return hearted

  await Promise.all(
    feedbackIds.map(async (id) => {
      try {
        const snap = await getDoc(doc(getDb(), 'feedbackHearts', heartDocId(id, user.uid)))
        if (snap.exists()) hearted.add(id)
      } catch {
        // ignore
      }
    }),
  )
  return hearted
}

export async function toggleFeedbackHeart(
  feedbackId: string,
): Promise<{ heartCount: number; hearted: boolean }> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('unauthenticated')

  const db = getDb()
  const feedbackRef = doc(db, 'feedback', feedbackId)
  const heartRef = doc(db, 'feedbackHearts', heartDocId(feedbackId, user.uid))

  return runTransaction(db, async (tx) => {
    const heartSnap = await tx.get(heartRef)
    const feedbackSnap = await tx.get(feedbackRef)
    if (!feedbackSnap.exists()) throw new Error('not_found')

    const current = Number(feedbackSnap.data().heartCount ?? 0)
    if (heartSnap.exists()) {
      tx.delete(heartRef)
      tx.update(feedbackRef, { heartCount: increment(-1) })
      return { heartCount: Math.max(0, current - 1), hearted: false }
    }

    tx.set(heartRef, {
      feedbackId,
      uid: user.uid,
      createdAt: serverTimestamp(),
    })
    tx.update(feedbackRef, { heartCount: increment(1) })
    return { heartCount: current + 1, hearted: true }
  })
}

export async function listComments(feedbackId: string): Promise<PublicComment[]> {
  const snap = await getDocs(
    query(collection(getDb(), 'feedbackComments'), where('feedbackId', '==', feedbackId)),
  )
  return snap.docs
    .map((d) => {
      const data = d.data()
      return {
        id: d.id,
        feedbackId: String(data.feedbackId ?? ''),
        name: String(data.name ?? ''),
        email: String(data.email ?? ''),
        body: String(data.body ?? ''),
        createdAt: data.createdAt,
      }
    })
    .sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt))
}

export async function addComment(input: {
  feedbackId: string
  name: string
  email: string
  body: string
}): Promise<PublicComment> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('unauthenticated')

  const db = getDb()
  const feedbackRef = doc(db, 'feedback', input.feedbackId)
  const commentsCol = collection(db, 'feedbackComments')

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const body = input.body.trim()
  if (name.length < 1 || email.length < 3 || body.length < 2) {
    throw new Error('invalid')
  }

  return runTransaction(db, async (tx) => {
    const feedbackSnap = await tx.get(feedbackRef)
    if (!feedbackSnap.exists() || !feedbackSnap.data().allowPublicReply) {
      throw new Error('not_allowed')
    }

    const commentRef = doc(commentsCol)
    tx.set(commentRef, {
      feedbackId: input.feedbackId,
      name,
      email,
      body,
      createdByUid: user.uid,
      createdAt: serverTimestamp(),
    })
    tx.update(feedbackRef, { commentCount: increment(1) })

    return {
      id: commentRef.id,
      feedbackId: input.feedbackId,
      name,
      email,
      body,
      createdAt: new Date(),
    }
  })
}
