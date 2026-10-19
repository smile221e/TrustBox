import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAdmin } from '@/hooks/useAdmin'

export function RequireAdmin({
  children,
  superOnly = false,
}: {
  children: ReactNode
  superOnly?: boolean
}) {
  const { t } = useTranslation()
  const { isAdmin, isSuperAdmin, loading } = useAdmin()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        <p className="inline-flex items-center gap-2">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          {t('common.loading')}
        </p>
      </div>
    )
  }

  if (!isAdmin || (superOnly && !isSuperAdmin)) {
    return <Navigate to="/" replace />
  }

  return children
}
