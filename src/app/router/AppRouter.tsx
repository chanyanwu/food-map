import { Navigate, Route, Routes, useLocation, type Location } from 'react-router-dom'
import { useAuth } from '../../features/authentication/hooks/useAuth'
import { LoginPage } from '../../features/authentication/pages/LoginPage'
import { PrivateHomePage } from '../../features/authentication/pages/PrivateHomePage'
import { NotFoundPage } from '../../shared/pages/NotFoundPage'
import { OfflinePage } from '../../shared/pages/OfflinePage'

function AuthLoadingPage() {
  return <main className="app-shell"><section className="page"><div className="hero-copy"><p className="eyebrow">Food Map</p><h1 className="display">正在確認登入狀態。</h1><p className="lede" role="status">請稍候，私人內容尚未載入。</p></div></section></main>
}

function AuthErrorPage() {
  const { state, retry } = useAuth()
  const message = state.kind === 'error' ? state.message : '登入狀態確認失敗。'
  return <main className="app-shell"><section className="page"><div className="hero-copy"><p className="eyebrow">設定或連線問題</p><h1 className="display">目前無法確認登入狀態。</h1><p className="lede" role="alert">{message}</p><button className="button" type="button" onClick={retry}>重新嘗試</button></div></section></main>
}

function destination(location: Location): string {
  const state = location.state
  return typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string' ? state.from : '/'
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()
  const location = useLocation()
  if (state.kind === 'loading') return <AuthLoadingPage />
  if (state.kind === 'error') return <AuthErrorPage />
  if (state.kind === 'unauthenticated') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}

function PublicLoginRoute() {
  const { state } = useAuth()
  const location = useLocation()
  if (state.kind === 'loading') return <AuthLoadingPage />
  if (state.kind === 'error') return <AuthErrorPage />
  if (state.kind === 'authenticated') return <Navigate to={destination(location)} replace />
  return <LoginPage />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><PrivateHomePage /></ProtectedRoute>} />
      <Route path="/login" element={<PublicLoginRoute />} />
      <Route path="/offline" element={<OfflinePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}