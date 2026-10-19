import { LoaderCircle } from 'lucide-react'
import { HashRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AccessGate } from '@/features/access/AccessGate'
import { useAccess } from '@/hooks/useAccess'
import { AccessProvider } from '@/providers/AccessProvider'
import { AdminProvider } from '@/providers/AdminProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { AppRoutes } from '@/routes'

function AccessBootScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--color-background)] text-[var(--color-muted-foreground)]">
      <p className="inline-flex items-center gap-2 text-sm">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
        {t('access.checking')}
      </p>
    </div>
  )
}

function GatedApp() {
  const { isUnlocked, isChecking } = useAccess()

  if (isChecking && !isUnlocked) {
    return <AccessBootScreen />
  }

  if (!isUnlocked) {
    return <AccessGate />
  }

  return (
    <AdminProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AdminProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AccessProvider>
          <GatedApp />
        </AccessProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
