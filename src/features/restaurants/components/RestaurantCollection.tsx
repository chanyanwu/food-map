import { useEffect, useState } from 'react'
import { firebaseWebConfig } from '../../../app/config/firebase'
import { createFirebaseServices } from '../../../core/firebase/firebaseClient'
import { getCurrentLocation, type UserLocation } from '../../../core/location/geolocation'
import { useAuth } from '../../authentication/hooks/useAuth'
import { calculateDistanceKilometers } from '../utils/distance'
import type { Restaurant } from '../models/restaurant'
import { FirebaseRestaurantRepository } from '../repositories/FirebaseRestaurantRepository'
import type { RestaurantRepository } from '../repositories/RestaurantRepository'
import { RestaurantList } from './RestaurantList'
import { RestaurantMap } from './RestaurantMap'

interface RestaurantCollectionProps {
  repository?: RestaurantRepository
  requestLocation?: () => Promise<UserLocation>
}

const nearbyRanges = [1, 3, 5, 10]

export function RestaurantCollection({ repository, requestLocation = getCurrentLocation }: RestaurantCollectionProps) {
  const { state } = useAuth()
  const [activeRepository] = useState(() => repository ?? new FirebaseRestaurantRepository(createFirebaseServices(firebaseWebConfig).firestore))
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [nearbyRange, setNearbyRange] = useState(3)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null)
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

  const restaurantsWithDistance = restaurants.map(restaurant => ({ restaurant, distance: userLocation ? calculateDistanceKilometers(userLocation, restaurant) : null }))
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
  const filteredRestaurants = restaurantsWithDistance
    .filter(({ restaurant, distance }) => (!userLocation || distance !== null && distance <= nearbyRange) && matchesSearch(restaurant, normalizedSearch))
    .sort((first, second) => userLocation ? (first.distance ?? Infinity) - (second.distance ?? Infinity) : 0)
  const visibleRestaurants = filteredRestaurants.map(({ restaurant }) => restaurant)
  const distances = Object.fromEntries(filteredRestaurants.filter(({ distance }) => distance !== null).map(({ restaurant, distance }) => [restaurant.id, distance!]))

  useEffect(() => {
    if (selectedRestaurantId && !visibleRestaurants.some(restaurant => restaurant.id === selectedRestaurantId)) setSelectedRestaurantId(null)
  }, [selectedRestaurantId, visibleRestaurants])

  async function requestCurrentLocation() {
    setIsLocating(true)
    setLocationError(null)
    try {
      setUserLocation(await requestLocation())
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : '目前無法取得你的位置')
    } finally {
      setIsLocating(false)
    }
  }

  function clearLocation() {
    setUserLocation(null)
    setLocationError(null)
    setSelectedRestaurantId(null)
  }

  async function deleteRestaurant(restaurant: Restaurant) {
    if (!ownerId) return
    setDeleteError(null)
    setDeletingId(restaurant.id)
    try {
      await activeRepository.deleteRestaurant(restaurant.id, ownerId)
      setRestaurants(current => current.filter(currentRestaurant => currentRestaurant.id !== restaurant.id))
      if (selectedRestaurantId === restaurant.id) setSelectedRestaurantId(null)
    } catch {
      setDeleteError('店家暫時無法刪除，請稍後再試。')
    } finally {
      setDeletingId(null)
    }
  }

  if (status === 'loading') return <section className="restaurant-list" aria-labelledby="restaurant-list-title"><h2 id="restaurant-list-title">我的店家</h2><p role="status">正在載入店家</p></section>
  if (status === 'error') return <section className="restaurant-list" aria-labelledby="restaurant-list-title"><h2 id="restaurant-list-title">我的店家</h2><p className="form-error" role="alert">店家清單暫時無法載入，請稍後再試。</p></section>
  return <div className="restaurant-collection"><section className="nearby-controls card" aria-label="附近收藏餐廳控制"><div><h2>附近收藏餐廳</h2><p>距離為直線距離，不代表道路距離或車程。</p></div><div className="nearby-control-actions"><button className="button button--secondary" type="button" onClick={() => void requestCurrentLocation()} disabled={isLocating}>{isLocating ? '定位中…' : '使用目前位置'}</button>{userLocation && <button className="button button--secondary" type="button" onClick={clearLocation}>顯示全部餐廳</button>}</div><label>搜尋自己的收藏<input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} /></label>{userLocation && <label>附近範圍<select value={nearbyRange} onChange={event => setNearbyRange(Number(event.target.value))}>{nearbyRanges.map(range => <option key={range} value={range}>{range} 公里</option>)}</select></label>}<p aria-live="polite">{userLocation ? `${nearbyRange} 公里內共 ${visibleRestaurants.length} 間收藏餐廳` : `共 ${visibleRestaurants.length} 間收藏餐廳`}</p>{userLocation && visibleRestaurants.length === 0 && <p>附近沒有已收藏且具有座標的餐廳</p>}{locationError && <p className="form-error" role="alert" aria-live="polite">{locationError}</p>}</section><div className="restaurant-overview"><RestaurantMap restaurants={visibleRestaurants} selectedRestaurantId={selectedRestaurantId} onSelectRestaurant={setSelectedRestaurantId} userLocation={userLocation} /><RestaurantList restaurants={visibleRestaurants} distances={distances} selectedRestaurantId={selectedRestaurantId} deletingId={deletingId} deleteError={deleteError} onSelectRestaurant={setSelectedRestaurantId} onDelete={restaurant => void deleteRestaurant(restaurant)} /></div></div>
}

function matchesSearch(restaurant: Restaurant, searchTerm: string): boolean {
  if (!searchTerm) return true
  return [restaurant.name, restaurant.address, restaurant.category, restaurant.notes].some(value => value.toLocaleLowerCase().includes(searchTerm))
}