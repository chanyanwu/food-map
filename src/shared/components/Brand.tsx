import { MapPinned } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Brand() {
  return <Link className="brand" to="/" aria-label="Food Map 首頁"><span className="brand-mark" aria-hidden="true"><MapPinned size={20} /></span>Food Map</Link>
}