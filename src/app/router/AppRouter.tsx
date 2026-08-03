import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '../../features/authentication/pages/LoginPage'
import { NotFoundPage } from '../../shared/pages/NotFoundPage'
import { OfflinePage } from '../../shared/pages/OfflinePage'
import { WelcomePage } from '../../shared/pages/WelcomePage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/offline" element={<OfflinePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}