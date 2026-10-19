import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AdminNav } from '@/features/admin/AdminNav'
import { RequireAdmin } from '@/features/admin/RequireAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  deleteRecipient,
  ensureRecipientsSeeded,
  slugifyRecipientId,
  upsertRecipient,
} from '@/lib/api/recipients'
import type { Recipient } from '@/types/recipient'
import { cn } from '@/lib/utils'

function isDirty(a: Recipient, b: Recipient): boolean {
  return (
    a.name !== b.name ||
    a.email !== b.email ||
    a.isActive !== b.isActive ||
    a.sortOrder !== b.sortOrder
  )
}

function RecipientsInner() {
  const { t } = useTranslation()
  const [saved, setSaved] = useState<Recipient[]>([])
  const [drafts, setDrafts] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const reload = async () => {
    const data = await ensureRecipientsSeeded()
    setSaved(data)
    setDrafts(data.map((r) => ({ ...r })))
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        await reload()
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

  const dirtyIds = useMemo(() => {
    const set = new Set<string>()
    for (const draft of drafts) {
      const original = saved.find((s) => s.id === draft.id)
      if (!original || isDirty(draft, original)) set.add(draft.id)
    }
    return set
  }, [drafts, saved])

  const setDraft = (id: string, patch: Partial<Recipient>) => {
    setDrafts((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const saveOne = async (id: string) => {
    const draft = drafts.find((r) => r.id === id)
    if (!draft) return
    setSavingId(id)
    setError(null)
    try {
      await upsertRecipient(draft)
      setSaved((prev) => {
        const exists = prev.some((r) => r.id === id)
        return exists ? prev.map((r) => (r.id === id ? { ...draft } : r)) : [...prev, { ...draft }]
      })
    } catch {
      setError(t('admin.errors.save'))
    } finally {
      setSavingId(null)
    }
  }

  const removeOne = async (id: string) => {
    if (!window.confirm(t('admin.recipientsDeleteConfirm'))) return
    setSavingId(id)
    setError(null)
    try {
      await deleteRecipient(id)
      setSaved((prev) => prev.filter((r) => r.id !== id))
      setDrafts((prev) => prev.filter((r) => r.id !== id))
    } catch {
      setError(t('admin.errors.save'))
    } finally {
      setSavingId(null)
    }
  }

  const addOne = async () => {
    const name = newName.trim()
    if (!name) return
    let id = slugifyRecipientId(name)
    if (drafts.some((r) => r.id === id)) {
      id = `${id}_${Date.now().toString(36)}`
    }
    const next: Recipient = {
      id,
      name,
      email: newEmail.trim().toLowerCase(),
      isActive: true,
      sortOrder: drafts.reduce((max, r) => Math.max(max, r.sortOrder), -1) + 1,
    }
    setSavingId(id)
    setError(null)
    try {
      await upsertRecipient(next)
      setSaved((prev) => [...prev, next])
      setDrafts((prev) => [...prev, next])
      setNewName('')
      setNewEmail('')
    } catch {
      setError(t('admin.errors.save'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 md:px-6">
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

      <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {drafts.map((draft) => {
          const dirty = dirtyIds.has(draft.id)
          return (
            <li key={draft.id} className="space-y-3 py-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {draft.id}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-[var(--color-destructive)]"
                  disabled={savingId === draft.id}
                  onClick={() => void removeOne(draft.id)}
                  aria-label={t('admin.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${draft.id}`}>{t('admin.fields.name')}</Label>
                  <Input
                    id={`name-${draft.id}`}
                    value={draft.name}
                    onChange={(e) => setDraft(draft.id, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`email-${draft.id}`}>{t('form.email.label')}</Label>
                  <Input
                    id={`email-${draft.id}`}
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft(draft.id, { email: e.target.value })}
                    placeholder="name@221e.space"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) => setDraft(draft.id, { isActive: e.target.checked })}
                  />
                  {t('admin.fields.active')}
                </label>
                <Button
                  type="button"
                  size="sm"
                  className={cn(!dirty && 'invisible pointer-events-none')}
                  disabled={!dirty || savingId === draft.id}
                  onClick={() => void saveOne(draft.id)}
                >
                  {savingId === draft.id ? t('common.loading') : t('admin.save')}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="space-y-3 rounded-lg border border-dashed border-[var(--color-border)] p-4">
        <h2 className="text-sm font-medium">{t('admin.recipientsAdd')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-recipient-name">{t('admin.fields.name')}</Label>
            <Input
              id="new-recipient-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-recipient-email">{t('form.email.label')}</Label>
            <Input
              id="new-recipient-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@221e.space"
            />
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!newName.trim() || savingId !== null}
          onClick={() => void addOne()}
        >
          <Plus className="h-4 w-4" />
          {t('admin.recipientsAdd')}
        </Button>
      </div>
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
