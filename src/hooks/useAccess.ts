import { useContext } from 'react'

import { AccessContext } from '@/providers/access-context'

export function useAccess() {
  const ctx = useContext(AccessContext)
  if (!ctx) {
    throw new Error('useAccess must be used within AccessProvider')
  }
  return ctx
}
