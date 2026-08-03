import { LogOut, Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Brand } from '../../../shared/components/Brand'
import { useAuth } from '../hooks/useAuth'
import { RestaurantList } from '../../restaurants/components/RestaurantList'

export function PrivateHomePage() {
  const { state, signOut } = useAuth()
  const location = useLocation()
  const name = state.kind === 'authenticated' ? state.user.displayName ?? state.user.email ?? 'Food Map 使用者' : 'Food Map 使用者'
  const notice = typeof location.state === 'object' && location.state !== null && 'notice' in location.state && typeof location.state.notice === 'string' ? location.state.notice : null
  return <main className="app-shell"><section className="page" aria-labelledby="private-home-title"><Brand /><div className="hero-copy"><p className="eyebrow">你的私人空間</p><h1 id="private-home-title" className="display">歡迎回來，{name}。</h1><p className="lede">建立餐廳資料，開始整理你的私人美食地圖。</p>{notice && <p className="success-message" role="status">{notice}</p>}<div className="actions"><Link className="button" to="/restaurants/new"><Plus size={18} aria-hidden="true" />新增店家</Link><button className="button button--secondary" type="button" onClick={() => void signOut()} aria-label="登出 Food Map"><LogOut size={18} aria-hidden="true" />登出</button></div></div><RestaurantList /></section></main>
}