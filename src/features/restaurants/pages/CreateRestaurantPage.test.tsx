import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../app/providers/AuthProvider'
import { MockAuthRepository } from '../../authentication/repositories/MockAuthRepository'
import type { RestaurantRepository } from '../repositories/RestaurantRepository'
import { CreateRestaurantPage } from './CreateRestaurantPage'

const authenticatedUser = { id: 'alice', displayName: 'Alice', email: 'alice@example.com', photoURL: null }

function renderPage(repository: RestaurantRepository) {
  return render(<AuthProvider repository={new MockAuthRepository({ initialUser: authenticatedUser })}><MemoryRouter><CreateRestaurantPage repository={repository} /></MemoryRouter></AuthProvider>)
}

describe('CreateRestaurantPage', () => {
  it('does not submit without a restaurant name', async () => {
    const repository = { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn(), getRestaurantById: vi.fn(), updateRestaurant: vi.fn(), deleteRestaurant: vi.fn() }
    renderPage(repository)
    fireEvent.click(await screen.findByRole('button', { name: '新增店家' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('請填寫店家名稱。')
    expect(repository.createRestaurant).not.toHaveBeenCalled()
  })

  it('submits valid restaurant details for the authenticated user', async () => {
    const repository = { createRestaurant: vi.fn().mockResolvedValue(undefined), getRestaurantsByOwner: vi.fn(), getRestaurantById: vi.fn(), updateRestaurant: vi.fn(), deleteRestaurant: vi.fn() }
    renderPage(repository)
    fireEvent.change(await screen.findByRole('textbox', { name: '店家名稱' }), { target: { value: 'Food Map Cafe' } })
    fireEvent.change(screen.getByRole('textbox', { name: '地址' }), { target: { value: 'Taipei' } })
    fireEvent.change(screen.getByRole('combobox', { name: '評分' }), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: '新增店家' }))
    await waitFor(() => expect(repository.createRestaurant).toHaveBeenCalledWith({ ownerId: 'alice', name: 'Food Map Cafe', address: 'Taipei', category: '', rating: 5, notes: '', latitude: null, longitude: null }))
  })

  it('shows a readable error when saving fails', async () => {
    const repository = { createRestaurant: vi.fn().mockRejectedValue(new Error('unavailable')), getRestaurantsByOwner: vi.fn(), getRestaurantById: vi.fn(), updateRestaurant: vi.fn(), deleteRestaurant: vi.fn() }
    renderPage(repository)
    fireEvent.change(await screen.findByRole('textbox', { name: '店家名稱' }), { target: { value: 'Food Map Cafe' } })
    fireEvent.click(screen.getByRole('button', { name: '新增店家' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('店家暫時無法儲存，請稍後再試。')
  })

  it('submits valid coordinates as numbers', async () => {
    const repository = { createRestaurant: vi.fn().mockResolvedValue(undefined), getRestaurantsByOwner: vi.fn(), getRestaurantById: vi.fn(), updateRestaurant: vi.fn(), deleteRestaurant: vi.fn() }
    renderPage(repository)
    fireEvent.change(await screen.findByRole('textbox', { name: '店家名稱' }), { target: { value: 'Food Map Cafe' } })
    fireEvent.change(screen.getByRole('textbox', { name: '緯度' }), { target: { value: '25.033' } })
    fireEvent.change(screen.getByRole('textbox', { name: '經度' }), { target: { value: '121.5654' } })
    fireEvent.click(screen.getByRole('button', { name: '新增店家' }))
    await waitFor(() => expect(repository.createRestaurant).toHaveBeenCalledWith(expect.objectContaining({ latitude: 25.033, longitude: 121.5654 })))
  })

  it.each([['not-a-number', '121.5654', '緯度與經度必須為合法數字。'], ['91', '121.5654', '緯度必須介於 -90 到 90。'], ['25.033', '181', '經度必須介於 -180 到 180。']])('rejects invalid coordinates', async (latitude, longitude, message) => {
    const repository = { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn(), getRestaurantById: vi.fn(), updateRestaurant: vi.fn(), deleteRestaurant: vi.fn() }
    renderPage(repository)
    fireEvent.change(await screen.findByRole('textbox', { name: '店家名稱' }), { target: { value: 'Food Map Cafe' } })
    fireEvent.change(screen.getByRole('textbox', { name: '緯度' }), { target: { value: latitude } })
    fireEvent.change(screen.getByRole('textbox', { name: '經度' }), { target: { value: longitude } })
    fireEvent.click(screen.getByRole('button', { name: '新增店家' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(repository.createRestaurant).not.toHaveBeenCalled()
  })
})