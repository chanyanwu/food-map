import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'

export function NotFoundPage() {
  return <main className="app-shell"><section className="page" aria-labelledby="not-found-title"><Brand /><div className="hero-copy"><p className="eyebrow">404</p><h1 id="not-found-title" className="display">這一頁還沒有餐桌。</h1><p className="lede">網址可能已變更，或尚未建立這個頁面。</p><Link className="button" to="/">回到首頁</Link></div></section></main>
}