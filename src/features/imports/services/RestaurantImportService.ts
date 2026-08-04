import type { CreateRestaurantInput } from '../../restaurants/models/restaurant'
import type { RestaurantRepository } from '../../restaurants/repositories/RestaurantRepository'
import type { CreateRestaurantSourceInput } from '../models/restaurantSource'
import type { RestaurantSourceRepository } from '../repositories/RestaurantSourceRepository'

export class RestaurantSourceSaveError extends Error {
  constructor(readonly restaurantId: string) {
    super('restaurant-source/save-failed')
  }
}

export class RestaurantImportService {
  constructor(private readonly restaurants: RestaurantRepository, private readonly sources: RestaurantSourceRepository) {}

  async create(input: CreateRestaurantInput, source: Omit<CreateRestaurantSourceInput, 'restaurantId'>): Promise<string> {
    const restaurantId = await this.restaurants.createRestaurant(input)
    try {
      await this.sources.createRestaurantSource({ ...source, restaurantId })
      return restaurantId
    } catch {
      throw new RestaurantSourceSaveError(restaurantId)
    }
  }
}