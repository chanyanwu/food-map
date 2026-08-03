import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { firebaseWebConfig } from '../../../app/config/firebase'
import { createFirebaseServices } from '../../../core/firebase/firebaseClient'
import { useAuth } from '../../authentication/hooks/useAuth'
import type { Restaurant } from '../models/restaurant'
import { FirebaseRestaurantRepository } from '../repositories/FirebaseRestaurantRepository'
import type { RestaurantRepository } from '../repositories/RestaurantRepository'

interface RestaurantListProps {
  repository?: RestaurantRepository
}

function toFriendlyRestaurantListError(): string {
  return '店家清單暫時無法載入，請稍後再試。'
}

export function RestaurantList({ repository }: RestaurantListProps) {
  const { state } = useAuth()
  const [activeRepository] = useState(() => repository ?? new FirebaseRestaurantRepository(createFirebaseServices(firebaseWebConfig).firestore))
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const ownerId = state.kind === 'authenticated' ? state.user.id : null

  useEffect(() => {
    if (!ownerId) return
    let active = true
    setStatus('loading')
    void activeRepository.getRestaurantsByOwner(ownerId).then(restaurants => {
      if (!active) return
      setRestaurants(restaurants)
      setStatus('ready')
    }).catch(() => {
      if (active) setStatus('error')
    })
    return () => {
      active = false
    }
  }, [activeRepository, ownerId])

  async function removeRestaurant(restaurant: Restaurant) {
    if (!ownerId || !window.confirm(`確定要刪除「${restaurant.name}」嗎？此操作無法復原。`)) return
    setDeleteError(null)
    setDeletingId(restaurant.id)
    try {
      await activeRepository.deleteRestaurant(restaurant.id, ownerId)
      setRestaurants(current => current.filter(currentRestaurant => currentRestaurant.id !== restaurant.id))
    } catch {
      setDeleteError('店家暫時無法刪除，請稍後再試。')
    } finally {
      setDeletingId(null)
    }
  }

  if (status === 'loading') return <section className="restaurant-list" aria-labelledby="restaurant-list-title"><h2 id="restaurant-list-title">我的店家</h2><p role="status">正在載入店家</p></section>
  if (status === 'error') return <section className="restaurant-list" aria-labelledby="restaurant-list-title"><h2 id="restaurant-list-title">我的店家</h2><p className="form-error" role="alert">{toFriendlyRestaurantListError()}</p></section>
  if (restaurants.length === 0) return <section className="restaurant-list" aria-labelledby="restaurant-list-title"><h2 id="restaurant-list-title">我的店家</h2><p>你還沒有建立店家</p></section>

  return (
    <section className="restaurant-list" aria-labelledby="restaurant-list-title">
      <div className="restaurant-list-heading"><h2 id="restaurant-list-title">我的店家</h2><p>{restaurants.length} 間店家</p></div>
      <div className="restaurant-grid">
        {restaurants.map(restaurant => <article className="restaurant-card card" key={restaurant.id}>
          <div><h3>{restaurant.name}</h3><p>{restaurant.category || '未分類'}</p></div>
          <p className="restaurant-rating">{restaurant.rating === null ? '未評分' : `${restaurant.rating} / 5`}</p>
          <p>{restaurant.address || '未提供地址'}</p>
          {restaurant.notes && <p className="restaurant-notes">{restaurant.notes}</p>}
          <div className="restaurant-card-actions"><Link className="button button--secondary" to={`/restaurants/${restaurant.id}/edit`}>編輯</Link><button className="button button--danger" type="button" onClick={() => void removeRestaurant(restaurant)} disabled={deletingId === restaurant.id}>{deletingId === restaurant.id ? '刪除中...' : '刪除'}</button></div>
        </article>)}
      </div>
      {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
    </section>
  )
}