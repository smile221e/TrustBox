import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AdminNav } from '@/features/admin/AdminNav'
import { RequireAdmin } from '@/features/admin/RequireAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { listRecipients, upsertRecipient } from '@/lib/api/adminRecipients'
import type { Recipient } from '@/types/recipient'

function RecipientsInner() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Recipient>>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const data = await listRecipients()
        if (!cancelled) {
          setItems(data)
          setDrafts(Object.fromEntries(data.map((r) => [r.id, { ...r }])))
        }
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

  const setDraft = (id: string, patch: Partial<Recipient>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const save = async (id: string) => {
    const draft = drafts[id]
    if (!draft) return
    setSavingId(id)
    setError(null)
    try {
      await upsertRecipient(draft)
      setItems((prev) => prev.map((r) => (r.id === id ? draft : r)))
    } catch {
      setError(t('admin.errors.save'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-12 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            {t('admin.recipients')}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {t('admin.recipientsHint')}
          </p>
        </div>
        <AdminNav />
      </div>

      {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
      {loading && (
        <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          {t('common.loading')}
        </p>
      )}

      <ul className="space-y-8">
        {items.map((item) => {
          const draft = drafts[item.id] ?? item
          return (
            <li key={item.id} className="space-y-3 border-b border-[var(--color-border)] pb-6">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {item.id}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${item.id}`}>{t('admin.fields.name')}</Label>
                  <Input
                    id={`name-${item.id}`}
                    value={draft.name}
                    onChange={(e) => setDraft(item.id, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`email-${item.id}`}>{t('form.email.label')}</Label>
                  <Input
                    id={`email-${item.id}`}
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft(item.id, { email: e.target.value })}
                    placeholder="name@221e.space"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft(item.id, { isActive: e.target.checked })}
                />
                {t('admin.fields.active')}
              </label>
              <Button
                type="button"
                size="sm"
                disabled={savingId === item.id}
                onClick={() => void save(item.id)}
              >
                {savingId === item.id ? t('common.loading') : t('admin.save')}
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function AdminRecipientsPage() {
  return (
    <RequireAdmin>
      <RecipientsInner />
    </RequireAdmin>
  )
}
