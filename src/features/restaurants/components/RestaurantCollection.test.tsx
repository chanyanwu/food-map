import { render, screen } from '@testing-library/react'
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

vi.mock('./RestaurantList', () => ({ RestaurantList: (props: { restaurants: Restaurant[] }) => { listSpy(props.restaurants); return <p>清單 {props.restaurants[0]?.name}</p> } }))
vi.mock('./RestaurantMap', () => ({ RestaurantMap: (props: { restaurants: Restaurant[] }) => { mapSpy(props.restaurants); return <p>地圖 {props.restaurants[0]?.name}</p> } }))

function repository(): RestaurantRepository {
  return { createRestaurant: vi.fn(), getRestaurantsByOwner: vi.fn().mockResolvedValue([restaurant]), getRestaurantById: vi.fn(), updateRestaurant: vi.fn(), deleteRestaurant: vi.fn() }
}

describe('RestaurantCollection', () => {
  it('loads once for the current user and passes the same data to list and map', async () => {
    const activeRepository = repository()
    render(<AuthProvider repository={new MockAuthRepository({ initialUser: { id: 'alice', displayName: 'Alice', email: 'alice@example.com', photoURL: null } })}><MemoryRouter><RestaurantCollection repository={activeRepository} /></MemoryRouter></AuthProvider>)
    expect(await screen.findByText('清單 Food Map Cafe')).toBeInTheDocument()
    expect(screen.getByText('地圖 Food Map Cafe')).toBeInTheDocument()
    expect(activeRepository.getRestaurantsByOwner).toHaveBeenCalledTimes(1)
    expect(activeRepository.getRestaurantsByOwner).toHaveBeenCalledWith('alice')
    expect(listSpy).toHaveBeenLastCalledWith(mapSpy.mock.lastCall?.[0])
  })
})