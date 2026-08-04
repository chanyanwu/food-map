import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { firebaseWebConfig } from '../../../app/config/firebase'
import { createFirebaseServices } from '../../../core/firebase/firebaseClient'
import { Brand } from '../../../shared/components/Brand'
import { useAuth } from '../../authentication/hooks/useAuth'
import { validateCoordinates } from '../models/coordinates'
import type { CreateRestaurantInput } from '../models/restaurant'
import { FirebaseRestaurantRepository } from '../repositories/FirebaseRestaurantRepository'
import type { RestaurantRepository } from '../repositories/RestaurantRepository'

interface CreateRestaurantPageProps {
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

const emptyForm: RestaurantForm = { name: '', address: '', category: '', rating: '', notes: '', latitude: '', longitude: '' }

function toFriendlyRestaurantError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'permission-denied') {
    return '你沒有新增這間店家的權限，請重新登入後再試。'
  }
  return '店家暫時無法儲存，請稍後再試。'
}

export function CreateRestaurantPage({ repository }: CreateRestaurantPageProps) {
  const { state } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<RestaurantForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const ownerId = state.kind === 'authenticated' ? state.user.id : null

  function updateForm(field: keyof RestaurantForm, value: string) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = form.name.trim()
    if (!ownerId) {
      setError('請先登入後再新增店家。')
      return
    }
    if (!name) {
      setError('請填寫店家名稱。')
      return
    }

    const coordinateValidation = validateCoordinates(form.latitude, form.longitude)
    if (!coordinateValidation.valid) {
      setError(coordinateValidation.message)
      return
    }
    const rating = form.rating === '' ? null : Number(form.rating)
    const input: CreateRestaurantInput = {
      ownerId,
      name,
      address: form.address.trim(),
      category: form.category.trim(),
      rating,
      notes: form.notes.trim(),
      ...coordinateValidation.coordinates
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const activeRepository = repository ?? new FirebaseRestaurantRepository(createFirebaseServices(firebaseWebConfig).firestore)
      await activeRepository.createRestaurant(input)
      setForm(emptyForm)
      navigate('/', { state: { notice: '店家已新增。' } })
    } catch (submissionError) {
      setError(toFriendlyRestaurantError(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="page" aria-labelledby="create-restaurant-title">
        <Brand />
        <div className="hero-copy">
          <p className="eyebrow">新增店家</p>
          <h1 id="create-restaurant-title" className="display">把想再去的地方記下來。</h1>
          <p className="lede">建立後只有你可以查看與管理這筆資料。</p>
        </div>
        <form className="restaurant-form card" onSubmit={event => void submit(event)} noValidate>
          <label>店家名稱<input name="name" value={form.name} onChange={event => updateForm('name', event.target.value)} required /></label>
          <label>地址<input name="address" value={form.address} onChange={event => updateForm('address', event.target.value)} /></label>
          <label>類別<input name="category" value={form.category} onChange={event => updateForm('category', event.target.value)} /></label>
          <label>評分<select name="rating" value={form.rating} onChange={event => updateForm('rating', event.target.value)}><option value="">未評分</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>
          <div className="coordinate-fields"><label>緯度<input name="latitude" inputMode="decimal" value={form.latitude} onChange={event => updateForm('latitude', event.target.value)} /></label><label>經度<input name="longitude" inputMode="decimal" value={form.longitude} onChange={event => updateForm('longitude', event.target.value)} /></label></div>
          <label>備註<textarea name="notes" value={form.notes} onChange={event => updateForm('notes', event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={isSubmitting || !ownerId}>{isSubmitting ? '儲存中...' : '新增店家'}</button>
        </form>
      </section>
    </main>
  )
}