import { LoaderCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { AdminNav } from '@/features/admin/AdminNav'
import { RequireAdmin } from '@/features/admin/RequireAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  inviteAdmin,
  listAdminInvites,
  listAdmins,
  revokeInvite,
  type AdminInvite,
} from '@/lib/api/adminInvites'
import type { AdminRole } from '@/lib/constants'

function AdminsInner() {
  const { t } = useTranslation()
  const [admins, setAdmins] = useState<
    Array<{ uid: string; email: string; displayName: string; role: AdminRole }>
  >([])
  const [invites, setInvites] = useState<AdminInvite[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    const [a, i] = await Promise.all([listAdmins(), listAdminInvites()])
    setAdmins(a)
    setInvites(i)
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

  const onInvite = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await inviteAdmin(email, 'admin')
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

      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {t('admin.activeAdmins')}
        </h2>
        <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {admins.map((a) => (
            <li key={a.uid} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span>
                {a.email}
                {a.displayName && a.displayName !== a.email ? ` · ${a.displayName}` : ''}
              </span>
              <span className="text-xs text-[var(--color-muted-foreground)]">{a.role}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {t('admin.pendingInvites')}
        </h2>
        <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {invites.length === 0 && (
            <li className="py-4 text-sm text-[var(--color-muted-foreground)]">{t('admin.noInvites')}</li>
          )}
          {invites.map((inv) => (
            <li key={inv.email} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span>
                {inv.email} · {inv.role}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  void revokeInvite(inv.email)
                    .then(reload)
                    .catch(() => setError(t('admin.errors.save')))
                }
              >
                {t('admin.revoke')}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={(e) => void onInvite(e)} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">{t('admin.inviteLabel')}</Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@221e.space"
          />
        </div>
        <Button type="submit" disabled={saving || !email.trim()}>
          {saving ? t('common.loading') : t('admin.invite')}
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
