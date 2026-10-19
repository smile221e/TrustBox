import { LogOut, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { BrandLogo } from '@/components/BrandLogo'
import { SectionLink } from '@/components/SectionLink'
import { Button } from '@/components/ui/button'
import { useAccess } from '@/hooks/useAccess'
import { useAdmin } from '@/hooks/useAdmin'
import { useTheme } from '@/hooks/useTheme'
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { lock } = useAccess()
  const { isAdmin } = useAdmin()
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const isAdminRoute = location.pathname.startsWith('/admin')

  const changeLanguage = (lng: AppLanguage) => {
    void i18n.changeLanguage(lng)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-[var(--color-border)]/70 backdrop-blur-md',
          isLanding
            ? 'bg-[var(--color-background)]/70'
            : 'bg-[var(--color-card)]/90',
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link
            to="/"
            className="flex items-center"
            aria-label={`${t('app.name')} — 221e`}
          >
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {isLanding && (
              <nav className="mr-1 hidden items-center gap-1 md:flex" aria-label={t('nav.home')}>
                <Button asChild variant="ghost" size="sm">
                  <SectionLink sectionId="how">{t('landing.nav.how')}</SectionLink>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <SectionLink sectionId="privacy">{t('landing.nav.privacy')}</SectionLink>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <SectionLink sectionId="feedback">{t('landing.cta')}</SectionLink>
                </Button>
              </nav>
            )}

            {isAdmin && !isAdminRoute && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/dashboard">{t('nav.admin')}</Link>
              </Button>
            )}

            <div
              className="flex rounded-lg border border-[var(--color-border)] p-0.5"
              role="group"
              aria-label={t('language.label')}
            >
              {SUPPORTED_LANGUAGES.map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => changeLanguage(lng)}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs font-medium uppercase transition-colors',
                    i18n.language === lng
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                  )}
                >
                  {lng}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={toggleTheme}
              aria-label={t('theme.toggle')}
              title={theme === 'light' ? t('theme.dark') : t('theme.light')}
            >
              {theme === 'light' ? <Moon /> : <Sun />}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => void lock()}
              aria-label={t('access.signOut')}
              title={t('access.signOut')}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-border)]/70 py-10 text-center text-sm text-[var(--color-muted-foreground)]">
        <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-foreground)]">
          {t('app.name')}
        </p>
        <p className="mt-2">© {new Date().getFullYear()}</p>
        <p className="mt-3">
          <SectionLink
            sectionId="privacy"
            className="hover:text-[var(--color-foreground)]"
          >
            {t('nav.privacy')}
          </SectionLink>
          <span className="mx-2">·</span>
          <Link to="/admin" className="hover:text-[var(--color-foreground)]">
            {t('nav.admin')}
          </Link>
        </p>
      </footer>
    </div>
  )
}
