import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Restaurant } from '../models/restaurant'
import { RestaurantList } from './RestaurantList'

const restaurants: Restaurant[] = [
  { id: 'restaurant-1', ownerId: 'alice', name: 'Food Map Cafe', address: 'Taipei', category: 'Cafe', rating: 5, notes: 'Great coffee', latitude: null, longitude: null, photoURLs: [], createdAt: new Date('2026-08-03'), updatedAt: new Date('2026-08-03'), schemaVersion: 1 },
  { id: 'restaurant-2', ownerId: 'alice', name: 'Night Market', address: 'Taichung', category: 'Street food', rating: null, notes: '', latitude: null, longitude: null, photoURLs: [], createdAt: new Date('2026-08-02'), updatedAt: new Date('2026-08-02'), schemaVersion: 1 }
]

function renderList(options: { restaurants?: Restaurant[]; deletingId?: string | null; deleteError?: string | null; onDelete?: (restaurant: Restaurant) => void } = {}) {
  return render(<MemoryRouter><RestaurantList restaurants={options.restaurants ?? restaurants} deletingId={options.deletingId ?? null} deleteError={options.deleteError ?? null} onDelete={options.onDelete ?? vi.fn()} /></MemoryRouter>)
}

describe('RestaurantList', () => {
  it('shows an empty state when no restaurants are provided', () => {
    renderList({ restaurants: [] })
    expect(screen.getByText('你還沒有建立店家')).toBeInTheDocument()
  })

  it('shows multiple restaurants provided by its parent', () => {
    renderList()
    expect(screen.getByText('2 間店家')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Food Map Cafe' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Night Market' })).toBeInTheDocument()
  })

  it('does not delete when confirmation is cancelled', () => {
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderList({ onDelete })
    fireEvent.click(screen.getAllByRole('button', { name: '刪除' })[0])
    expect(window.confirm).toHaveBeenCalledWith('確定要刪除「Food Map Cafe」嗎？此操作無法復原。')
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('notifies its parent when deletion is confirmed', () => {
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderList({ onDelete })
    fireEvent.click(screen.getAllByRole('button', { name: '刪除' })[0])
    expect(onDelete).toHaveBeenCalledWith(restaurants[0])
  })

  it('shows a deletion error provided by its parent', () => {
    renderList({ deleteError: '店家暫時無法刪除，請稍後再試。' })
    expect(screen.getByRole('alert')).toHaveTextContent('店家暫時無法刪除，請稍後再試。')
  })
})