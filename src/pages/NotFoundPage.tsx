import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-start justify-center gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold">{t('common.notFound')}</h1>
      <Link
        to="/"
        className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
      >
        {t('common.backHome')}
      </Link>
    </section>
  )
}
