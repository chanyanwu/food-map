import { ArrowLeft, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../../../shared/components/Brand'

export function LoginPage() {
  return <main className="app-shell"><section className="page" aria-labelledby="login-title"><Brand /><div className="hero-copy"><p className="eyebrow">私人資料，自己掌握</p><h1 id="login-title" className="display">準備好收集下一間店了嗎？</h1><p className="lede">登入功能會在下一階段以 Google Sign-In 與 Firebase Authentication 安全串接。</p><Link className="button button--secondary" to="/"><ArrowLeft size={18} aria-hidden="true" /> 返回首頁</Link></div><aside className="login-card card" aria-label="登入功能說明"><LogIn className="feature-icon" size={32} aria-hidden="true" /><h2>Google 登入</h2><p>此按鈕目前為介面占位，尚未連線 Google 或 Firebase，也不會傳送任何資料。</p><button className="button" type="button" disabled aria-describedby="login-status">使用 Google 繼續</button><p id="login-status" role="status">登入功能開發中</p></aside></section></main>
}