import { Link } from 'react-router-dom'
import type { Restaurant } from '../models/restaurant'
import { formatDistance } from '../utils/distance'

interface RestaurantListProps {
  restaurants: Restaurant[]
  distances?: Record<string, number>
  selectedRestaurantId?: string | null
  deletingId: string | null
  deleteError: string | null
  onSelectRestaurant?(restaurantId: string): void
  onDelete(restaurant: Restaurant): void
}

export function RestaurantList({ restaurants, distances = {}, selectedRestaurantId = null, deletingId, deleteError, onSelectRestaurant = () => undefined, onDelete }: RestaurantListProps) {
  if (restaurants.length === 0) return <section className="restaurant-list" aria-labelledby="restaurant-list-title"><h2 id="restaurant-list-title">我的店家</h2><p>你還沒有建立店家</p></section>

  return (
    <section className="restaurant-list" aria-labelledby="restaurant-list-title">
      <div className="restaurant-list-heading"><h2 id="restaurant-list-title">我的店家</h2><p>{restaurants.length} 間店家</p></div>
      <div className="restaurant-grid">
        {restaurants.map(restaurant => <article className={`restaurant-card card${selectedRestaurantId === restaurant.id ? ' restaurant-card--selected' : ''}`} key={restaurant.id}>
          <div><h3>{restaurant.name}</h3><p>{restaurant.category || '未分類'}</p></div>
          <p className="restaurant-rating">{restaurant.rating === null ? '未評分' : `${restaurant.rating} / 5`}</p>
          <p>{restaurant.address || '未提供地址'}</p>
          {distances[restaurant.id] !== undefined && <p className="restaurant-distance">距離約 {formatDistance(distances[restaurant.id])}</p>}
          {restaurant.notes && <p className="restaurant-notes">{restaurant.notes}</p>}
          <div className="restaurant-card-actions"><button className="button button--secondary" type="button" onClick={() => onSelectRestaurant(restaurant.id)} disabled={restaurant.latitude === null || restaurant.longitude === null} aria-pressed={selectedRestaurantId === restaurant.id}>{restaurant.latitude === null || restaurant.longitude === null ? '沒有座標' : '在地圖查看'}</button>{restaurant.latitude !== null && restaurant.longitude !== null && <a className="button button--secondary" href={googleMapsUrl(restaurant)} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}>在 Google Maps 開啟<span className="sr-only">（在新視窗）</span></a>}<Link className="button button--secondary" to={`/restaurants/${restaurant.id}/edit`} onClick={event => event.stopPropagation()}>編輯</Link><button className="button button--danger" type="button" onClick={() => { if (window.confirm(`確定要刪除「${restaurant.name}」嗎？此操作無法復原。`)) onDelete(restaurant) }} disabled={deletingId === restaurant.id}>{deletingId === restaurant.id ? '刪除中...' : '刪除'}</button></div>
        </article>)}
      </div>
      {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
    </section>
  )
}

function googleMapsUrl(restaurant: Restaurant): string {
  const query = restaurant.latitude !== null && restaurant.longitude !== null ? `${restaurant.latitude},${restaurant.longitude}` : `${restaurant.name} ${restaurant.address}`
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`
}