import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/ui/button'
import { useAccess } from '@/hooks/useAccess'
import { useAuth } from '@/hooks/useAuth'
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/lib/constants'
import { cn } from '@/lib/utils'

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  )
}

/**
 * Full-viewport gate: Google Sign-In, then PeopleForce department check.
 */
export function AccessGate() {
  const { t, i18n } = useTranslation()
  const { signInWithGoogle, isConfigured } = useAuth()
  const { errorCode, clearError, isChecking } = useAccess()
  const [signingIn, setSigningIn] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const changeLanguage = (lng: AppLanguage) => {
    void i18n.changeLanguage(lng)
  }

  const displayError =
    localError ??
    (errorCode ? t(`access.errors.${errorCode}`, { defaultValue: t('access.errors.unknown') }) : null)

  const handleGoogle = async () => {
    clearError()
    setLocalError(null)

    if (!isConfigured) {
      setLocalError(t('access.errors.firebase_required'))
      return
    }

    setSigningIn(true)
    try {
      await signInWithGoogle()
      // AccessProvider verifies PeopleForce and unlocks (or signs out on failure).
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLocalError(null)
      } else if (code === 'auth/unauthorized-domain') {
        setLocalError(t('access.errors.unauthorized_domain'))
      } else {
        setLocalError(t('access.errors.google_failed'))
      }
    } finally {
      setSigningIn(false)
    }
  }

  const busy = signingIn || isChecking

  return (
    <div className="relative flex min-h-svh flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(45,143,132,0.2),transparent_55%),linear-gradient(180deg,#e7f1ef_0%,#f3f6f5_100%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(45,212,191,0.1),transparent_55%),linear-gradient(180deg,#071412_0%,#0b1a18_100%)]"
        aria-hidden
      />

      <header className="flex items-center justify-between px-4 py-4 md:px-6">
        <BrandLogo />
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
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl">
              {t('app.name')}
            </p>
            <h1 className="text-lg font-medium text-[var(--color-foreground)] md:text-xl">
              {t('access.title')}
            </h1>
          </div>

          {displayError && (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {displayError}
            </p>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => void handleGoogle()}
          >
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" />
                {t('access.checking')}
              </>
            ) : (
              <>
                <GoogleMark className="h-5 w-5" />
                {t('access.google')}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
