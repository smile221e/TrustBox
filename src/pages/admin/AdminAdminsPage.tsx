import { LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { AdminNav } from '@/features/admin/AdminNav'
import { RequireAdmin } from '@/features/admin/RequireAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  addAdminByEmail,
  listAdminDirectory,
  removeAdminByEmail,
  type AdminListItem,
} from '@/lib/api/adminEmails'
import { BOOTSTRAP_SUPER_ADMIN_EMAIL } from '@/lib/admin-bootstrap'

function AdminsInner() {
  const { t } = useTranslation()
  const [items, setItems] = useState<AdminListItem[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    setItems(await listAdminDirectory())
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

  const onAdd = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await addAdminByEmail(email, 'admin')
      setEmail('')
      await reload()
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'invalid_domain'
          ? t('admin.errors.domain')
          : t('admin.errors.save'),
      )
    } finally {
      setSaving(false)
    }
  }

  const onRemove = async (target: string) => {
    if (target === BOOTSTRAP_SUPER_ADMIN_EMAIL) return
    if (!window.confirm(t('admin.removeConfirm', { email: target }))) return
    setSaving(true)
    setError(null)
    try {
      await removeAdminByEmail(target)
      await reload()
    } catch {
      setError(t('admin.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            {t('admin.admins')}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t('admin.adminsHint')}</p>
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
        {items.length === 0 && !loading && (
          <li className="py-4 text-sm text-[var(--color-muted-foreground)]">{t('admin.noAdmins')}</li>
        )}
        {items.map((a) => (
          <li key={a.email} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-medium">{a.email}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {a.role}
                {a.displayName ? ` · ${a.displayName}` : ''}
                {a.active ? ` · ${t('admin.signedInOnce')}` : ` · ${t('admin.pendingSignIn')}`}
              </p>
            </div>
            {a.email !== BOOTSTRAP_SUPER_ADMIN_EMAIL && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={saving}
                onClick={() => void onRemove(a.email)}
              >
                {t('admin.remove')}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={(e) => void onAdd(e)} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="add-admin-email">{t('admin.addLabel')}</Label>
          <Input
            id="add-admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@221e.space"
          />
        </div>
        <Button type="submit" disabled={saving || !email.trim()}>
          {saving ? t('common.loading') : t('admin.add')}
        </Button>
      </form>
    </section>
  )
}

export function AdminAdminsPage() {
  return (
    <RequireAdmin superOnly>
      <AdminsInner />
    </RequireAdmin>
  )
}
