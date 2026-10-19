import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { DEFAULT_RECIPIENT_IDS } from '@/lib/constants'

export function AdminRecipientsPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-12 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('admin.recipients')}</h1>
        <Link to="/admin/dashboard" className="text-sm underline">
          {t('admin.dashboard')}
        </Link>
      </div>

      <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        {DEFAULT_RECIPIENT_IDS.map((id) => (
          <li key={id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium uppercase">{id}</span>
            <span className="text-[var(--color-muted-foreground)]">email — Stage 05</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
