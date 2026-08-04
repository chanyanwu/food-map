import { Link } from 'react-router-dom'
import type { Restaurant } from '../models/restaurant'

interface RestaurantListProps {
  restaurants: Restaurant[]
  deletingId: string | null
  deleteError: string | null
  onDelete(restaurant: Restaurant): void
}

export function RestaurantList({ restaurants, deletingId, deleteError, onDelete }: RestaurantListProps) {
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
          <div className="restaurant-card-actions"><Link className="button button--secondary" to={`/restaurants/${restaurant.id}/edit`}>編輯</Link><button className="button button--danger" type="button" onClick={() => { if (window.confirm(`確定要刪除「${restaurant.name}」嗎？此操作無法復原。`)) onDelete(restaurant) }} disabled={deletingId === restaurant.id}>{deletingId === restaurant.id ? '刪除中...' : '刪除'}</button></div>
        </article>)}
      </div>
      {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
    </section>
  )
}