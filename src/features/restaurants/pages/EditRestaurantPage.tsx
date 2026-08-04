import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { firebaseWebConfig } from '../../../app/config/firebase'
import { createFirebaseServices } from '../../../core/firebase/firebaseClient'
import { Brand } from '../../../shared/components/Brand'
import { useAuth } from '../../authentication/hooks/useAuth'
import { validateCoordinates } from '../models/coordinates'
import type { Restaurant, UpdateRestaurantInput } from '../models/restaurant'
import { FirebaseRestaurantRepository } from '../repositories/FirebaseRestaurantRepository'
import type { RestaurantRepository } from '../repositories/RestaurantRepository'

interface EditRestaurantPageProps {
  repository?: RestaurantRepository
}

interface RestaurantForm {
  name: string
  address: string
  category: string
  rating: string
  notes: string
  latitude: string
  longitude: string
}

function toForm(restaurant: Restaurant): RestaurantForm {
  return { name: restaurant.name, address: restaurant.address, category: restaurant.category, rating: restaurant.rating?.toString() ?? '', notes: restaurant.notes, latitude: restaurant.latitude?.toString() ?? '', longitude: restaurant.longitude?.toString() ?? '' }
}

function toFriendlyEditError(error: unknown): string {
  if (error instanceof Error && error.message === 'restaurant/permission-denied') return '你沒有編輯這間店家的權限。'
  return '店家暫時無法更新，請稍後再試。'
}

export function EditRestaurantPage({ repository }: EditRestaurantPageProps) {
  const { state } = useAuth()
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const [activeRepository] = useState(() => repository ?? new FirebaseRestaurantRepository(createFirebaseServices(firebaseWebConfig).firestore))
  const [form, setForm] = useState<RestaurantForm | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'forbidden' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const ownerId = state.kind === 'authenticated' ? state.user.id : null

  useEffect(() => {
    if (!restaurantId || !ownerId) return
    let active = true
    void activeRepository.getRestaurantById(restaurantId).then(restaurant => {
      if (!active) return
      if (!restaurant) {
        setStatus('not-found')
      } else if (restaurant.ownerId !== ownerId) {
        setStatus('forbidden')
      } else {
        setForm(toForm(restaurant))
        setStatus('ready')
      }
    }).catch(() => {
      if (active) setStatus('error')
    })
    return () => {
      active = false
    }
  }, [activeRepository, ownerId, restaurantId])

  function updateForm(field: keyof RestaurantForm, value: string) {
    setForm(current => current ? { ...current, [field]: value } : current)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form || !ownerId || !restaurantId) return
    const name = form.name.trim()
    if (!name) {
      setError('請填寫店家名稱。')
      return
    }
    const coordinateValidation = validateCoordinates(form.latitude, form.longitude)
    if (!coordinateValidation.valid) {
      setError(coordinateValidation.message)
      return
    }
    const input: UpdateRestaurantInput = { name, address: form.address.trim(), category: form.category.trim(), rating: form.rating === '' ? null : Number(form.rating), notes: form.notes.trim(), ...coordinateValidation.coordinates }
    setError(null)
    setIsSubmitting(true)
    try {
      await activeRepository.updateRestaurant(restaurantId, ownerId, input)
      navigate('/', { state: { notice: '店家已更新。' } })
    } catch (submissionError) {
      setError(toFriendlyEditError(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') return <main className="app-shell"><section className="page"><p role="status">正在載入店家</p></section></main>
  if (status === 'not-found') return <main className="app-shell"><section className="page"><p role="alert">找不到這間店家。</p></section></main>
  if (status === 'forbidden') return <main className="app-shell"><section className="page"><p role="alert">你沒有編輯這間店家的權限。</p></section></main>
  if (status === 'error') return <main className="app-shell"><section className="page"><p role="alert">店家暫時無法載入，請稍後再試。</p></section></main>
  if (!form) return null

  return <main className="app-shell"><section className="page" aria-labelledby="edit-restaurant-title"><Brand /><div className="hero-copy"><p className="eyebrow">編輯店家</p><h1 id="edit-restaurant-title" className="display">更新這間店的資料。</h1></div><form className="restaurant-form card" onSubmit={event => void submit(event)} noValidate><label>店家名稱<input name="name" value={form.name} onChange={event => updateForm('name', event.target.value)} required /></label><label>地址<input name="address" value={form.address} onChange={event => updateForm('address', event.target.value)} /></label><label>類別<input name="category" value={form.category} onChange={event => updateForm('category', event.target.value)} /></label><label>評分<select name="rating" value={form.rating} onChange={event => updateForm('rating', event.target.value)}><option value="">未評分</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label><div className="coordinate-fields"><label>緯度<input name="latitude" inputMode="decimal" value={form.latitude} onChange={event => updateForm('latitude', event.target.value)} /></label><label>經度<input name="longitude" inputMode="decimal" value={form.longitude} onChange={event => updateForm('longitude', event.target.value)} /></label></div><label>備註<textarea name="notes" value={form.notes} onChange={event => updateForm('notes', event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button" type="submit" disabled={isSubmitting}>{isSubmitting ? '儲存中...' : '儲存變更'}</button></form></section></main>
}