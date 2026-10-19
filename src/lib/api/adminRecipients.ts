import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'

import { DEFAULT_RECIPIENT_IDS } from '@/lib/constants'
import { getDb } from '@/lib/firebase'
import type { Recipient } from '@/types/recipient'

const DEFAULT_NAMES: Record<(typeof DEFAULT_RECIPIENT_IDS)[number], string> = {
  unspecified: 'Unspecified',
  owner: 'Owner',
  ceo: 'CEO',
  hrd: 'HR Director',
  sfo: 'Security / Compliance',
  tso: 'Tech / Operations',
  cco: 'Customer / Commercial',
  cmo: 'Marketing / Communications',
}

export async function listRecipients(): Promise<Recipient[]> {
  const snap = await getDocs(query(collection(getDb(), 'recipients'), orderBy('sortOrder', 'asc')))
  const byId = new Map(
    snap.docs.map((d) => {
      const data = d.data()
      const recipient: Recipient = {
        id: d.id,
        name: String(data.name ?? d.id),
        email: String(data.email ?? ''),
        isActive: data.isActive !== false,
        sortOrder: Number(data.sortOrder ?? 0),
      }
      return [d.id, recipient] as const
    }),
  )

  return DEFAULT_RECIPIENT_IDS.map((id, index) => {
    const existing = byId.get(id)
    if (existing) return existing
    return {
      id,
      name: DEFAULT_NAMES[id],
      email: '',
      isActive: true,
      sortOrder: index,
    }
  })
}

export async function upsertRecipient(input: {
  id: string
  name: string
  email: string
  isActive: boolean
  sortOrder: number
}): Promise<void> {
  await setDoc(
    doc(getDb(), 'recipients', input.id),
    {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export type RecipientDoc = Recipient & { updatedAt?: Timestamp }
