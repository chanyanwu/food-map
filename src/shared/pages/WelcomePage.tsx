import { ArrowRight, Heart, MapPinned, NotebookPen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'

const features = [{ icon: MapPinned, text: '把想吃與吃過的地方，留在自己的地圖上。' }, { icon: Heart, text: '收藏值得再訪的味道，資料只屬於你。' }, { icon: NotebookPen, text: '用照片與筆記，慢慢補全每一間店的記憶。' }]

export function WelcomePage() {
  return <main className="app-shell"><section className="page" aria-labelledby="welcome-title"><Brand /><div className="hero-copy"><p className="eyebrow">你的私人美食地圖</p><h1 id="welcome-title" className="display">記下每一次好好吃飯。</h1><p className="lede">Food Map 把收藏、用餐紀錄與靈感照片收在同一張地圖裡。第一步，先登入並建立你的私人空間。</p><div className="actions"><Link className="button" to="/login">前往登入 <ArrowRight size={18} aria-hidden="true" /></Link></div></div><ul className="feature-list card" aria-label="Food Map 功能摘要">{features.map(({ icon: Icon, text }) => <li key={text}><Icon className="feature-icon" size={24} aria-hidden="true" /><span>{text}</span></li>)}</ul></section></main>
}