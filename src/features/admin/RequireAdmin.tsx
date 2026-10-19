import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
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

export function AdminDenied() {
  const { t } = useTranslation()
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t('admin.loginTitle')}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{t('admin.denied')}</p>
      <Button asChild variant="secondary">
        <Link to="/">{t('common.backHome')}</Link>
      </Button>
    </section>
  )
}
