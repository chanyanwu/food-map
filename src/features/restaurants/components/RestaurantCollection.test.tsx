import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../../app/providers/AuthProvider'
import { MockAuthRepository } from '../../authentication/repositories/MockAuthRepository'
import type { Restaurant } from '../models/restaurant'
import type { RestaurantRepository } from '../repositories/RestaurantRepository'
import { RestaurantCollection } from './RestaurantCollection'

const restaurant: Restaurant = { id: 'restaurant-1', ownerId: 'alice', name: 'Food Map Cafe', address: 'Taipei', category: 'Cafe', rating: null, notes: '', latitude: 25.033, longitude: 121.5654, photoURLs: [], createdAt: new Date(), updatedAt: new Date(), schemaVersion: 1 }
const listSpy = vi.fn()
const mapSpy = vi.fn()

vi.mock('./RestaurantList', () => ({ RestaurantList: (props: { restaurants: Restaurant[]; selectedRestaurantId: string | null; onSelectRestaurant(id: string): void }) => { listSpy(props); return <><p>清單 {props.restaurants.map(restaurant => restaurant.name).join(',')}</p><p>清單選取 {props.selectedRestaurantId}</p><button type="button" onClick={() => props.onSelectRestaurant('restaurant-1')}>從清單選取</button></> } }))
vi.mock('./RestaurantMap', () => ({ RestaurantMap: (props: { restaurants: Restaurant[]; selectedRestaurantId: string | null; onSelectRestaurant(id: string): void }) => { mapSpy(props); return <><p>地圖 {props.restaurants.map(restaurant => restaurant.name).join(',')}</p><p>地圖選取 {props.selectedRestaurantId}</p></> } }))

function repository(restaurants: Restaurant[] = [restaurant]): RestaurantRepository {
  return { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn().mockResolvedValue(restaurants), getRestaurantById: vi.fn(), updateRestaurant: vi.fn(), deleteRestaurant: vi.fn() }
}

function renderCollection(activeRepository: RestaurantRepository, requestLocation = vi.fn()) {
  return render(<AuthProvider repository={new MockAuthRepository({ initialUser: { id: 'alice', displayName: 'Alice', email: 'alice@example.com', photoURL: null } })}><MemoryRouter><RestaurantCollection repository={activeRepository} requestLocation={requestLocation} /></MemoryRouter></AuthProvider>)
}

describe('RestaurantCollection', () => {
  it('loads once for the current user and passes the same data to list and map', async () => {
    const activeRepository = repository()
    renderCollection(activeRepository)
    expect(await screen.findByText('清單 Food Map Cafe')).toBeInTheDocument()
    expect(screen.getByText('地圖 Food Map Cafe')).toBeInTheDocument()
    expect(activeRepository.getRestaurantsByOwner).toHaveBeenCalledTimes(1)
    expect(activeRepository.getRestaurantsByOwner).toHaveBeenCalledWith('alice')
    expect(listSpy.mock.lastCall?.[0].restaurants).toBe(mapSpy.mock.lastCall?.[0].restaurants)
  })

  it('filters and sorts only coordinate-bearing nearby restaurants after an explicit location request', async () => {
    const nearRestaurant = { ...restaurant, id: 'near', name: 'Near Cafe', latitude: 25.033, longitude: 121.5654 }
    const farRestaurant = { ...restaurant, id: 'far', name: 'Far Cafe', latitude: 25.15, longitude: 121.7 }
    const noCoordinates = { ...restaurant, id: 'unknown', name: 'No Coordinates', latitude: null, longitude: null }
    const requestLocation = vi.fn().mockResolvedValue({ latitude: 25.034, longitude: 121.5655, accuracy: 15 })
    renderCollection(repository([farRestaurant, noCoordinates, nearRestaurant]), requestLocation)
    await screen.findByText('清單 Far Cafe,No Coordinates,Near Cafe')
    fireEvent.click(screen.getByRole('button', { name: '使用目前位置' }))
    await screen.findByText('清單 Near Cafe')
    expect(requestLocation).toHaveBeenCalledTimes(1)
    expect(screen.getByText('3 公里內共 1 間收藏餐廳')).toBeInTheDocument()
  })

  it('searches locally and clears shared selection when the selected restaurant is filtered out', async () => {
    const secondRestaurant = { ...restaurant, id: 'restaurant-2', name: 'Noodle House' }
    renderCollection(repository([restaurant, secondRestaurant]))
    await screen.findByText('清單 Food Map Cafe,Noodle House')
    fireEvent.click(screen.getByRole('button', { name: '從清單選取' }))
    await screen.findByText('地圖選取 restaurant-1')
    fireEvent.change(screen.getByLabelText('搜尋自己的收藏'), { target: { value: 'noodle' } })
    await screen.findByText('清單 Noodle House')
    await waitFor(() => expect(screen.getByText('地圖選取')).toBeInTheDocument())
  })
})