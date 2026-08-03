import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../app/providers/AuthProvider'
import { MockAuthRepository } from '../../authentication/repositories/MockAuthRepository'
import type { Restaurant } from '../models/restaurant'
import type { RestaurantRepository } from '../repositories/RestaurantRepository'
import { RestaurantList } from './RestaurantList'

const user = { id: 'alice', displayName: 'Alice', email: 'alice@example.com', photoURL: null }
const restaurants: Restaurant[] = [
  { id: 'restaurant-1', ownerId: 'alice', name: 'Food Map Cafe', address: 'Taipei', category: 'Cafe', rating: 5, notes: 'Great coffee', latitude: null, longitude: null, photoURLs: [], createdAt: new Date('2026-08-03'), updatedAt: new Date('2026-08-03'), schemaVersion: 1 },
  { id: 'restaurant-2', ownerId: 'alice', name: 'Night Market', address: 'Taichung', category: 'Street food', rating: null, notes: '', latitude: null, longitude: null, photoURLs: [], createdAt: new Date('2026-08-02'), updatedAt: new Date('2026-08-02'), schemaVersion: 1 }
]

function renderList(repository: RestaurantRepository) {
  return render(<AuthProvider repository={new MockAuthRepository({ initialUser: user })}><MemoryRouter><RestaurantList repository={repository} /></MemoryRouter></AuthProvider>)
}

describe('RestaurantList', () => {
  it('shows a loading state while restaurants are being fetched', async () => {
    const repository = { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn(() => new Promise<Restaurant[]>(() => undefined)) }
    renderList(repository)
    expect(await screen.findByRole('status')).toHaveTextContent('正在載入店家')
  })

  it('shows an empty state when the user has no restaurants', async () => {
    const repository = { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn().mockResolvedValue([]) }
    renderList(repository)
    expect(await screen.findByText('你還沒有建立店家')).toBeInTheDocument()
    expect(repository.getRestaurantsByOwner).toHaveBeenCalledWith('alice')
  })

  it('shows multiple restaurants returned for the current user', async () => {
    const repository = { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn().mockResolvedValue(restaurants) }
    renderList(repository)
    expect(await screen.findByText('2 間店家')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Food Map Cafe' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Night Market' })).toBeInTheDocument()
  })

  it('shows a readable error when retrieval fails', async () => {
    const repository = { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn().mockRejectedValue(new Error('unavailable')) }
    renderList(repository)
    expect(await screen.findByRole('alert')).toHaveTextContent('店家清單暫時無法載入，請稍後再試。')
  })
})