import { createContext } from 'react'
import type { User } from 'firebase/auth'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  isConfigured: boolean
  signInWithGoogle: () => Promise<User>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
