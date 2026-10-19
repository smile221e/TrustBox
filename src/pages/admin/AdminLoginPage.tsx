import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function AdminLoginPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t('admin.loginTitle')}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{t('admin.loginHint')}</p>
      <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm">
        {t('admin.unavailable')}
      </p>
      <div className="flex gap-3 text-sm">
        <Link to="/admin/dashboard" className="text-[var(--color-primary)] underline">
          {t('admin.dashboard')}
        </Link>
        <Link to="/" className="text-[var(--color-muted-foreground)] underline">
          {t('common.backHome')}
        </Link>
      </div>
    </section>
  )
}
