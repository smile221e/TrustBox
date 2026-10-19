import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminRecipientsPage } from '@/pages/admin/AdminRecipientsPage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * HashRouter is used at the app root for GitHub Pages deep-link support
 * (`/#/admin`, `/#/admin/dashboard`, etc.).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LandingPage />} />
        <Route path="admin" element={<AdminLoginPage />} />
        <Route path="admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="admin/recipients" element={<AdminRecipientsPage />} />
        <Route path="admin/login" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
