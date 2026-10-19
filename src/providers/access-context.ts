import { createContext } from 'react'

export type AccessContextValue = {
  email: string | null
  isUnlocked: boolean
  /** True while Firebase auth or PeopleForce verification is in progress */
  isChecking: boolean
  /** Last gate error code for AccessGate UI */
  errorCode: string | null
  clearError: () => void
  lock: () => Promise<void>
}

export const AccessContext = createContext<AccessContextValue | null>(null)
