import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../app/providers/AuthProvider'
import { MockAuthRepository } from '../../authentication/repositories/MockAuthRepository'
import type { Restaurant } from '../models/restaurant'
import type { RestaurantRepository } from '../repositories/RestaurantRepository'
import { EditRestaurantPage } from './EditRestaurantPage'

const user = { id: 'alice', displayName: 'Alice', email: 'alice@example.com', photoURL: null }
const restaurant: Restaurant = { id: 'restaurant-1', ownerId: 'alice', name: 'Food Map Cafe', address: 'Taipei', category: 'Cafe', rating: 4, notes: 'Great coffee', latitude: null, longitude: null, photoURLs: [], createdAt: new Date('2026-08-03'), updatedAt: new Date('2026-08-03'), schemaVersion: 1 }

function repository(overrides: Partial<RestaurantRepository> = {}): RestaurantRepository {
  return { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn(), getRestaurantById: vi.fn().mockResolvedValue(restaurant), updateRestaurant: vi.fn().mockResolvedValue(undefined), deleteRestaurant: vi.fn(), ...overrides }
}

function renderPage(activeRepository: RestaurantRepository) {
  return render(<AuthProvider repository={new MockAuthRepository({ initialUser: user })}><MemoryRouter initialEntries={['/restaurants/restaurant-1/edit']}><Routes><Route path="/restaurants/:restaurantId/edit" element={<EditRestaurantPage repository={activeRepository} />} /><Route path="/" element={<p>首頁</p>} /></Routes></MemoryRouter></AuthProvider>)
}

describe('EditRestaurantPage', () => {
  it('loads and displays the existing restaurant', async () => {
    renderPage(repository())
    expect(await screen.findByDisplayValue('Food Map Cafe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Taipei')).toBeInTheDocument()
    expect(screen.getByDisplayValue('4')).toBeInTheDocument()
  })

  it('does not save without a restaurant name', async () => {
    const activeRepository = repository()
    renderPage(activeRepository)
    fireEvent.change(await screen.findByRole('textbox', { name: '店家名稱' }), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存變更' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('請填寫店家名稱。')
    expect(activeRepository.updateRestaurant).not.toHaveBeenCalled()
  })

  it('saves permitted fields with the current user id', async () => {
    const activeRepository = repository()
    renderPage(activeRepository)
    fireEvent.change(await screen.findByRole('textbox', { name: '店家名稱' }), { target: { value: 'Updated Cafe' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存變更' }))
    await waitFor(() => expect(activeRepository.updateRestaurant).toHaveBeenCalledWith('restaurant-1', 'alice', { name: 'Updated Cafe', address: 'Taipei', category: 'Cafe', rating: 4, notes: 'Great coffee' }))
    expect(await screen.findByText('首頁')).toBeInTheDocument()
  })

  it('shows a readable error when saving fails', async () => {
    renderPage(repository({ updateRestaurant: vi.fn().mockRejectedValue(new Error('unavailable')) }))
    fireEvent.click(await screen.findByRole('button', { name: '儲存變更' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('店家暫時無法更新，請稍後再試。')
  })

  it('shows not found and forbidden states', async () => {
    const notFound = repository({ getRestaurantById: vi.fn().mockResolvedValue(null) })
    const { unmount } = renderPage(notFound)
    expect(await screen.findByRole('alert')).toHaveTextContent('找不到這間店家。')
    unmount()
    renderPage(repository({ getRestaurantById: vi.fn().mockResolvedValue({ ...restaurant, ownerId: 'bob' }) }))
    expect(await screen.findByRole('alert')).toHaveTextContent('你沒有編輯這間店家的權限。')
  })
})