import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAdmin } from '@/hooks/useAdmin'

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

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t('admin.loginTitle')}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{t('admin.denied')}</p>
      <p className="text-xs text-[var(--color-muted-foreground)]">{t('admin.loginHint')}</p>
      <Button asChild variant="secondary">
        <Link to="/">{t('common.backHome')}</Link>
      </Button>
    </section>
  )
}
