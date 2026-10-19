import { createContext } from 'react'

import type { AdminProfile } from '@/types/admin'

export type AdminContextValue = {
  profile: AdminProfile | null
  isAdmin: boolean
  isSuperAdmin: boolean
  loading: boolean
  refresh: () => Promise<void>
}

export const AdminContext = createContext<AdminContextValue | null>(null)
