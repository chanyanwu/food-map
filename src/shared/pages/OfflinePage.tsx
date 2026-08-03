import { WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'

export function OfflinePage() {
  return <main className="app-shell"><section className="page" aria-labelledby="offline-title"><Brand /><div className="hero-copy"><p className="eyebrow">離線狀態</p><h1 id="offline-title" className="display">目前沒有連線。</h1><p className="lede">已快取的資料會在後續階段提供離線閱讀；請恢復網路後再重試。</p><Link className="button" to="/">回到首頁</Link></div><aside className="notice card"><WifiOff className="feature-icon" aria-hidden="true" /><h2>離線頁基礎已建立</h2><p>餐廳快取、草稿佇列與同步狀態將在後續階段實作。</p></aside></section></main>
}