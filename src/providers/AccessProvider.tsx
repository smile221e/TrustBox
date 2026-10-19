import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { isAllowedCorporateEmail, normalizeEmail } from '@/lib/access'
import { STORAGE_KEYS } from '@/lib/constants'
import { AccessContext } from '@/providers/access-context'

function clearLegacyAccessStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.accessEmail)
  } catch {
    // ignore
  }
}

/**
 * Unlocks the app for Google users with an @221e.space mailbox.
 * No PeopleForce / Cloud Functions required.
 */
export function AccessProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth()
  const [domainErrorSticky, setDomainErrorSticky] = useState(false)

  const email = user?.email ? normalizeEmail(user.email) : null
  const domainDenied = Boolean(email && !isAllowedCorporateEmail(email))
  const allowedEmail = email && isAllowedCorporateEmail(email) ? email : null

  // Keep domain error visible after we sign the user out.
  if (domainDenied && !domainErrorSticky) {
    setDomainErrorSticky(true)
  } else if (allowedEmail && domainErrorSticky) {
    setDomainErrorSticky(false)
  }

  const clearError = useCallback(() => setDomainErrorSticky(false), [])

  const lock = useCallback(async () => {
    clearLegacyAccessStorage()
    setDomainErrorSticky(false)
    await signOut()
  }, [signOut])

  useEffect(() => {
    clearLegacyAccessStorage()
  }, [])

  useEffect(() => {
    if (domainDenied) {
      void signOut()
    }
  }, [domainDenied, signOut])

  const value = useMemo(
    () => ({
      email: allowedEmail,
      isUnlocked: Boolean(allowedEmail) && !authLoading,
      isChecking: authLoading,
      errorCode: domainErrorSticky ? 'domain' : null,
      clearError,
      lock,
    }),
    [allowedEmail, authLoading, domainErrorSticky, clearError, lock],
  )

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}
