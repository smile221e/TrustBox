import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import { useAdmin } from '@/hooks/useAdmin'
import { cn } from '@/lib/utils'

const links = [
  { to: '/admin/dashboard', key: 'dashboard' },
  { to: '/admin/recipients', key: 'recipients' },
  { to: '/admin/admins', key: 'admins', superOnly: true },
] as const

export function AdminNav() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAdmin()
  const location = useLocation()

  return (
    <nav className="flex flex-wrap gap-3 text-sm" aria-label={t('admin.title')}>
      {links
        .filter((l) => !('superOnly' in l && l.superOnly) || isSuperAdmin)
        .map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={cn(
              'underline-offset-4 hover:underline',
              location.pathname === l.to
                ? 'font-medium text-[var(--color-foreground)]'
                : 'text-[var(--color-muted-foreground)]',
            )}
          >
            {t(`admin.${l.key}`)}
          </Link>
        ))}
    </nav>
  )
}
