import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

function repository(overrides: Partial<RestaurantRepository> = {}): RestaurantRepository {
  return { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn().mockResolvedValue(restaurants), getRestaurantById: vi.fn(), updateRestaurant: vi.fn(), deleteRestaurant: vi.fn().mockResolvedValue(undefined), ...overrides }
}

describe('RestaurantList', () => {
  it('shows a loading state while restaurants are being fetched', async () => {
    const activeRepository = repository({ getRestaurantsByOwner: vi.fn(() => new Promise<Restaurant[]>(() => undefined)) })
    renderList(activeRepository)
    expect(await screen.findByRole('status')).toHaveTextContent('正在載入店家')
  })

  it('shows an empty state when the user has no restaurants', async () => {
    const activeRepository = repository({ getRestaurantsByOwner: vi.fn().mockResolvedValue([]) })
    renderList(activeRepository)
    expect(await screen.findByText('你還沒有建立店家')).toBeInTheDocument()
    expect(activeRepository.getRestaurantsByOwner).toHaveBeenCalledWith('alice')
  })

  it('shows multiple restaurants returned for the current user', async () => {
    renderList(repository())
    expect(await screen.findByText('2 間店家')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Food Map Cafe' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Night Market' })).toBeInTheDocument()
  })

  it('shows a readable error when retrieval fails', async () => {
    renderList(repository({ getRestaurantsByOwner: vi.fn().mockRejectedValue(new Error('unavailable')) }))
    expect(await screen.findByRole('alert')).toHaveTextContent('店家清單暫時無法載入，請稍後再試。')
  })

  it('does not delete when confirmation is cancelled', async () => {
    const activeRepository = repository()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderList(activeRepository)
    fireEvent.click((await screen.findAllByRole('button', { name: '刪除' }))[0])
    expect(window.confirm).toHaveBeenCalledWith('確定要刪除「Food Map Cafe」嗎？此操作無法復原。')
    expect(activeRepository.deleteRestaurant).not.toHaveBeenCalled()
  })

  it('deletes the confirmed restaurant and updates the count', async () => {
    const activeRepository = repository()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderList(activeRepository)
    fireEvent.click((await screen.findAllByRole('button', { name: '刪除' }))[0])
    await waitFor(() => expect(activeRepository.deleteRestaurant).toHaveBeenCalledWith('restaurant-1', 'alice'))
    expect(await screen.findByText('1 間店家')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Food Map Cafe' })).not.toBeInTheDocument()
  })

  it('shows a readable error when deletion fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderList(repository({ deleteRestaurant: vi.fn().mockRejectedValue(new Error('unavailable')) }))
    fireEvent.click((await screen.findAllByRole('button', { name: '刪除' }))[0])
    expect(await screen.findByRole('alert')).toHaveTextContent('店家暫時無法刪除，請稍後再試。')
  })
})