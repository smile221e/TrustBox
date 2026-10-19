import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { isFirebaseConfigured } from '@/lib/env'
import { getFirebaseAuth } from '@/lib/firebase'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  // Prefer 221e Google Workspace accounts in the account picker
  hd: '221e.space',
  prompt: 'select_account',
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(configured)

  useEffect(() => {
    if (!configured) return

    const auth = getFirebaseAuth()
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next)
      setLoading(false)
    })
    return unsub
  }, [configured])

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      throw new Error('firebase_not_configured')
    }
    const result = await signInWithPopup(getFirebaseAuth(), googleProvider)
    return result.user
  }, [configured])

  const signOut = useCallback(async () => {
    if (!configured) return
    await firebaseSignOut(getFirebaseAuth())
  }, [configured])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: configured ? loading : false,
      isConfigured: configured,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, configured, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
