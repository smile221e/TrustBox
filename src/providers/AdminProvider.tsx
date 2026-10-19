import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { ensureAdminClaim, loadAdminProfile } from '@/lib/api/claimAdmin'
import { AdminContext } from '@/providers/admin-context'
import type { AdminProfile } from '@/types/admin'

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestId, setRequestId] = useState(0)

  const refresh = useCallback(async () => {
    setRequestId((n) => n + 1)
  }, [])

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    const runId = requestId

    void (async () => {
      if (!user) {
        if (!cancelled && runId === requestId) {
          setProfile(null)
          setLoading(false)
        }
        return
      }

      if (!cancelled) setLoading(true)
      try {
        const claimed = await ensureAdminClaim()
        const next = claimed ?? (await loadAdminProfile(user.uid))
        if (!cancelled) setProfile(next)
      } catch {
        if (!cancelled) setProfile(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, user, requestId])

  const value = useMemo(
    () => ({
      profile,
      isAdmin: Boolean(profile),
      isSuperAdmin: profile?.role === 'super_admin',
      loading: authLoading || loading,
      refresh,
    }),
    [profile, authLoading, loading, refresh],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}
