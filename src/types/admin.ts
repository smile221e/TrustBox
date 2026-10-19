import type { AdminRole } from '@/lib/constants'

export interface AdminProfile {
  uid: string
  email: string
  displayName: string
  role: AdminRole
  /** Optional recipient scope for restricted admins (MVP may be unused) */
  assignedRecipientIds?: string[]
  createdAt: unknown
  updatedAt: unknown
}
