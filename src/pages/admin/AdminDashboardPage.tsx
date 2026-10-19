import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-12 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('admin.title')}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{t('admin.dashboard')}</p>
        </div>
        <nav className="flex gap-3 text-sm">
          <Link to="/admin/recipients" className="underline">
            {t('admin.recipients')}
          </Link>
          <Link to="/admin" className="underline">
            {t('admin.loginTitle')}
          </Link>
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {['128', '17', '94'].map((value, index) => (
          <div
            key={value}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {index === 0 ? 'Total' : index === 1 ? 'New' : 'Closed'}
            </p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Placeholder stats</p>
          </div>
        ))}
      </div>

      <p className="rounded-lg border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted-foreground)]">
        {t('admin.unavailable')}
      </p>
    </section>
  )
}
