import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import { DEFAULT_RECIPIENT_IDS } from '@/lib/constants'
import { getDb } from '@/lib/firebase'
import type { Recipient } from '@/types/recipient'

export const DEFAULT_RECIPIENT_SEED: Recipient[] = [
  { id: 'unspecified', name: 'Unspecified', email: '', isActive: true, sortOrder: 0 },
  { id: 'owner', name: 'Owner', email: '', isActive: true, sortOrder: 1 },
  { id: 'ceo', name: 'CEO', email: '', isActive: true, sortOrder: 2 },
  { id: 'hrd', name: 'HR Director', email: '', isActive: true, sortOrder: 3 },
  { id: 'sfo', name: 'Security / Compliance', email: '', isActive: true, sortOrder: 4 },
  { id: 'tso', name: 'Tech / Operations', email: '', isActive: true, sortOrder: 5 },
  { id: 'cco', name: 'Customer / Commercial', email: '', isActive: true, sortOrder: 6 },
  { id: 'cmo', name: 'Marketing / Communications', email: '', isActive: true, sortOrder: 7 },
]

function mapRecipient(id: string, data: Record<string, unknown>): Recipient {
  return {
    id,
    name: String(data.name ?? id),
    email: String(data.email ?? ''),
    isActive: data.isActive !== false,
    sortOrder: Number(data.sortOrder ?? 0),
  }
}

/** All recipients from Firestore (admin). Empty DB → in-memory defaults (not written). */
export async function listRecipients(): Promise<Recipient[]> {
  const snap = await getDocs(query(collection(getDb(), 'recipients'), orderBy('sortOrder', 'asc')))
  if (snap.empty) {
    return DEFAULT_RECIPIENT_SEED.map((r) => ({ ...r }))
  }
  return snap.docs.map((d) => mapRecipient(d.id, d.data()))
}

/** Active recipients for the public form (corporate users). */
export async function listActiveRecipients(): Promise<Recipient[]> {
  const all = await listRecipients()
  return all.filter((r) => r.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getRecipient(id: string): Promise<Recipient | null> {
  const snap = await getDoc(doc(getDb(), 'recipients', id))
  if (snap.exists()) return mapRecipient(snap.id, snap.data())
  const seed = DEFAULT_RECIPIENT_SEED.find((r) => r.id === id)
  return seed ? { ...seed } : null
}

/** Write default roster once so the landing form can read live data. */
export async function ensureRecipientsSeeded(): Promise<Recipient[]> {
  const snap = await getDocs(collection(getDb(), 'recipients'))
  if (!snap.empty) {
    return listRecipients()
  }
  await Promise.all(
    DEFAULT_RECIPIENT_SEED.map((r) =>
      setDoc(doc(getDb(), 'recipients', r.id), {
        name: r.name,
        email: r.email,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ),
  )
  return listRecipients()
}

export async function upsertRecipient(input: {
  id: string
  name: string
  email: string
  isActive: boolean
  sortOrder: number
}): Promise<void> {
  const ref = doc(getDb(), 'recipients', input.id)
  const existing = await getDoc(ref)
  await setDoc(
    ref,
    {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
}

export async function deleteRecipient(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'recipients', id))
}

export function slugifyRecipientId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  const safe = base || 'recipient'
  // Prefer ASCII-ish ids for rules/docs; fallback with timestamp
  const ascii = safe.replace(/[^a-z0-9_]/g, '')
  if (ascii.length >= 2) return ascii
  return `recipient_${Date.now().toString(36)}`
}

export function isKnownDefaultRecipientId(id: string): boolean {
  return (DEFAULT_RECIPIENT_IDS as readonly string[]).includes(id)
}
