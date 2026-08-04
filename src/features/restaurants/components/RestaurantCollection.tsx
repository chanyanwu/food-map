import { useEffect, useState } from 'react'
import { firebaseWebConfig } from '../../../app/config/firebase'
import { createFirebaseServices } from '../../../core/firebase/firebaseClient'
import { useAuth } from '../../authentication/hooks/useAuth'
import type { Restaurant } from '../models/restaurant'
import { FirebaseRestaurantRepository } from '../repositories/FirebaseRestaurantRepository'
import type { RestaurantRepository } from '../repositories/RestaurantRepository'
import { RestaurantList } from './RestaurantList'
import { RestaurantMap } from './RestaurantMap'

interface RestaurantCollectionProps {
  repository?: RestaurantRepository
}

export function RestaurantCollection({ repository }: RestaurantCollectionProps) {
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
    void activeRepository.getRestaurantsByOwner(ownerId).then(result => {
      if (!active) return
      setRestaurants(result)
      setStatus('ready')
    }).catch(() => {
      if (active) setStatus('error')
    })
    return () => {
      active = false
    }
  }, [activeRepository, ownerId])

  async function deleteRestaurant(restaurant: Restaurant) {
    if (!ownerId) return
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
  if (status === 'error') return <section className="restaurant-list" aria-labelledby="restaurant-list-title"><h2 id="restaurant-list-title">我的店家</h2><p className="form-error" role="alert">店家清單暫時無法載入，請稍後再試。</p></section>
  return <div className="restaurant-overview"><RestaurantMap restaurants={restaurants} /><RestaurantList restaurants={restaurants} deletingId={deletingId} deleteError={deleteError} onDelete={restaurant => void deleteRestaurant(restaurant)} /></div>
}