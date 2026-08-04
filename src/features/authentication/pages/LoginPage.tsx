import { ArrowLeft, LogIn } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Brand } from '../../../shared/components/Brand'
import { isInAppBrowser } from '../services/signInEnvironment'

export function LoginPage() {
  const { actionError, isSigningIn, signInWithGoogle } = useAuth()
  const location = useLocation()
  const requestedRoute = typeof location.state === 'object' && location.state !== null && 'from' in location.state && typeof location.state.from === 'string' ? location.state.from : '/'
  const inAppBrowser = isInAppBrowser()
  return <main className="app-shell"><section className="page" aria-labelledby="login-title"><Brand /><div className="hero-copy"><p className="eyebrow">私人資料，自己掌握</p><h1 id="login-title" className="display">準備好收集下一間店了嗎？</h1><p className="lede">使用 Google 帳號登入，建立只屬於你的 Food Map 私人空間。</p><Link className="button button--secondary" to="/"><ArrowLeft size={18} aria-hidden="true" /> 返回首頁</Link></div><aside className="login-card card" aria-label="Google 登入"><LogIn className="feature-icon" size={32} aria-hidden="true" /><h2>Google 登入</h2><p>Food Map 只會建立登入所需的私人帳戶資料，不會保存 Google 密碼或 access token。</p>{inAppBrowser && <p className="form-error" role="status">此瀏覽器可能無法完成 Google 登入，請使用 Safari 或 Chrome 開啟。</p>}<button className="button" type="button" onClick={() => void signInWithGoogle(requestedRoute)} disabled={isSigningIn} aria-label="使用 Google 帳號登入" aria-describedby="login-status">{isSigningIn ? '正在開啟 Google 登入...' : '使用 Google 帳號登入'}</button>{actionError ? <p id="login-status" className="form-error" role="alert">{actionError}</p> : <p id="login-status" role="status">登入後會回到你原本想前往的頁面。</p>}</aside></section></main>
}