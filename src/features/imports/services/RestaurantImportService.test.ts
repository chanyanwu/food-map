import { describe, expect, it, vi } from 'vitest'
import type { Restaurant } from '../../restaurants/models/restaurant'
import type { RestaurantRepository } from '../../restaurants/repositories/RestaurantRepository'
import type { RestaurantSourceRepository } from '../repositories/RestaurantSourceRepository'
import { RestaurantImportService, RestaurantSourceSaveError } from './RestaurantImportService'

const restaurantInput = { ownerId: 'alice', name: 'Cafe', address: '', category: '', rating: null, notes: '', latitude: null, longitude: null }
const sourceInput = { ownerId: 'alice', sourceType: 'social-content' as const, sourcePlatform: 'Instagram' as const, sourceUrl: null, sourceText: 'Source', sourceNote: '', mentionedDishes: ['Coffee'] }

function restaurantRepository(createRestaurant = vi.fn().mockResolvedValue('restaurant-1')): RestaurantRepository {
  return { createRestaurant, getRestaurantsByOwner: vi.fn().mockResolvedValue([] as Restaurant[]), getRestaurantById: vi.fn().mockResolvedValue(null), updateRestaurant: vi.fn().mockResolvedValue(undefined), deleteRestaurant: vi.fn().mockResolvedValue(undefined) }
}

function sourceRepository(createRestaurantSource = vi.fn().mockResolvedValue('source-1')): RestaurantSourceRepository {
  return { createRestaurantSource, getRestaurantSourceById: vi.fn().mockResolvedValue(null), updateRestaurantSource: vi.fn().mockResolvedValue(undefined), deleteRestaurantSource: vi.fn().mockResolvedValue(undefined) }
}

describe('RestaurantImportService', () => {
  it('creates the restaurant before its linked source', async () => {
    const restaurants = restaurantRepository()
    const sources = sourceRepository()
    await expect(new RestaurantImportService(restaurants, sources).create(restaurantInput, sourceInput)).resolves.toBe('restaurant-1')
    expect(sources.createRestaurantSource).toHaveBeenCalledWith({ ...sourceInput, restaurantId: 'restaurant-1' })
  })

  it('reports a recoverable source failure with the already-created restaurant id', async () => {
    const restaurants = restaurantRepository()
    const sources = sourceRepository(vi.fn().mockRejectedValue(new Error('offline')))
    await expect(new RestaurantImportService(restaurants, sources).create(restaurantInput, sourceInput)).rejects.toEqual(new RestaurantSourceSaveError('restaurant-1'))
  })
})