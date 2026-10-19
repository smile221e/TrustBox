import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { useAuth } from '@/hooks/useAuth'
import { isAllowedCorporateEmail, normalizeEmail } from '@/lib/access'
import { VerifyAccessError, verifyAccessEmail } from '@/lib/api/verifyAccessEmail'
import { STORAGE_KEYS } from '@/lib/constants'
import { AccessContext } from '@/providers/access-context'

function clearLegacyAccessStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.accessEmail)
  } catch {
    // ignore
  }
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth()
  const [allowedEmail, setAllowedEmail] = useState<string | null>(null)
  const [peopleForcePending, setPeopleForcePending] = useState(false)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [verifiedForUid, setVerifiedForUid] = useState<string | null>(null)

  const clearError = useCallback(() => setErrorCode(null), [])

  const lock = useCallback(async () => {
    clearLegacyAccessStorage()
    setAllowedEmail(null)
    setVerifiedForUid(null)
    await signOut()
  }, [signOut])

  useEffect(() => {
    clearLegacyAccessStorage()
  }, [])

  useEffect(() => {
    if (authLoading) return

    const email = user?.email ? normalizeEmail(user.email) : null
    const uid = user?.uid ?? null

    let cancelled = false

    void (async () => {
      if (!email || !uid) {
        startTransition(() => {
          if (cancelled) return
          setAllowedEmail(null)
          setVerifiedForUid(null)
          setPeopleForcePending(false)
        })
        return
      }

      if (verifiedForUid === uid && allowedEmail === email) {
        return
      }

      startTransition(() => {
        if (!cancelled) setPeopleForcePending(true)
      })

      try {
        if (!isAllowedCorporateEmail(email)) {
          if (cancelled) return
          setErrorCode('domain')
          setAllowedEmail(null)
          setVerifiedForUid(null)
          await signOut()
          return
        }

        const result = await verifyAccessEmail(email)
        if (cancelled) return

        if (!result.allowed) {
          setErrorCode('domain')
          setAllowedEmail(null)
          setVerifiedForUid(null)
          await signOut()
          return
        }

        setErrorCode(null)
        setAllowedEmail(result.email ?? email)
        setVerifiedForUid(uid)
      } catch (err) {
        if (cancelled) return
        if (err instanceof VerifyAccessError) {
          setErrorCode(err.code)
        } else {
          setErrorCode('unavailable')
        }
        setAllowedEmail(null)
        setVerifiedForUid(null)
        await signOut()
      } finally {
        if (!cancelled) setPeopleForcePending(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, authLoading, signOut, verifiedForUid, allowedEmail])

  const isChecking = authLoading || peopleForcePending

  const value = useMemo(
    () => ({
      email: allowedEmail,
      isUnlocked: Boolean(allowedEmail) && !isChecking,
      isChecking,
      errorCode,
      clearError,
      lock,
    }),
    [allowedEmail, isChecking, errorCode, clearError, lock],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}
