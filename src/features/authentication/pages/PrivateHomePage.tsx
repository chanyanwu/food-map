import { LogOut } from 'lucide-react'
import { Brand } from '../../../shared/components/Brand'
import { useAuth } from '../hooks/useAuth'

export function PrivateHomePage() {
  const { state, signOut } = useAuth()
  const name = state.kind === 'authenticated' ? state.user.displayName ?? state.user.email ?? 'Food Map 使用者' : 'Food Map 使用者'
  return <main className="app-shell"><section className="page" aria-labelledby="private-home-title"><Brand /><div className="hero-copy"><p className="eyebrow">你的私人空間</p><h1 id="private-home-title" className="display">歡迎回來，{name}。</h1><p className="lede">Google 登入、私人路由與個人資料安全基礎已完成。餐廳與地圖功能將在後續階段加入。</p><button className="button button--secondary" type="button" onClick={() => void signOut()} aria-label="登出 Food Map"><LogOut size={18} aria-hidden="true" />登出</button></div></section></main>
}