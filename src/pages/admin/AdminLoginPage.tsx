import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { useAdmin } from '@/hooks/useAdmin'

/** Entry for /admin — admins go to dashboard; everyone else is sent home (no public admin UI). */
export function AdminLoginPage() {
  const { t } = useTranslation()
  const { isAdmin, loading } = useAdmin()

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

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Navigate to="/" replace />
}
