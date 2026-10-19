import { LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { AdminNav } from '@/features/admin/AdminNav'
import { RequireAdmin } from '@/features/admin/RequireAdmin'
import { Button } from '@/components/ui/button'
import {
  formatFeedbackDate,
  listFeedback,
  type AdminFeedbackDoc,
} from '@/lib/api/adminFeedback'
import { cn } from '@/lib/utils'

function DashboardInner() {
  const { t } = useTranslation()
  const [items, setItems] = useState<AdminFeedbackDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'closed'>('all')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await listFeedback()
        if (!cancelled) setItems(data)
      } catch {
        if (!cancelled) setError(t('admin.errors.load'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  const stats = useMemo(() => {
    const total = items.length
    const neu = items.filter((i) => i.status === 'new').length
    const closed = items.filter((i) => i.status === 'closed').length
    return { total, neu, closed }
  }, [items])

  const visible = items.filter((i) => (filter === 'all' ? true : i.status === filter))

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-12 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            {t('admin.title')}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t('admin.dashboard')}</p>
        </div>
        <AdminNav />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t('admin.stats.total'), value: stats.total },
          { label: t('admin.stats.new'), value: stats.neu },
          { label: t('admin.stats.closed'), value: stats.closed },
        ].map((s) => (
          <div key={s.label} className="border-b border-[var(--color-border)] pb-3">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {s.label}
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'new', 'in_progress', 'closed'] as const).map((f) => (
          <Button
            key={f}
            type="button"
            size="sm"
            variant={filter === f ? 'default' : 'secondary'}
            onClick={() => setFilter(f)}
          >
            {t(`admin.filters.${f}`)}
          </Button>
        ))}
      </div>

      {loading && (
        <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          {t('common.loading')}
        </p>
      )}
      {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}

      {!loading && !error && (
        <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {visible.length === 0 && (
            <li className="py-8 text-sm text-[var(--color-muted-foreground)]">{t('admin.empty')}</li>
          )}
          {visible.map((item) => (
            <li key={item.id}>
              <Link
                to={`/admin/feedback/${item.id}`}
                className="flex flex-col gap-1 py-4 transition-colors hover:bg-[var(--color-muted)]/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">
                    {t(`topics.${item.topicId}`)} · {item.recipientName}
                  </p>
                  <p className="line-clamp-2 text-sm text-[var(--color-muted-foreground)]">
                    {item.message}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 font-medium',
                      item.status === 'new' && 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
                      item.status === 'in_progress' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
                      item.status === 'closed' && 'bg-[var(--color-muted)]',
                    )}
                  >
                    {t(`admin.status.${item.status}`)}
                  </span>
                  <span>{item.type === 'anonymous' ? t('admin.anonymous') : t('admin.identified')}</span>
                  <span>{formatFeedbackDate(item.createdAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function AdminDashboardPage() {
  return (
    <RequireAdmin>
      <DashboardInner />
    </RequireAdmin>
  )
}
