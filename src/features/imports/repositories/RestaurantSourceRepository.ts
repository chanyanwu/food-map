import type { CreateRestaurantSourceInput, RestaurantSource } from '../models/restaurantSource'

export interface RestaurantSourceRepository {
  createRestaurantSource(input: CreateRestaurantSourceInput): Promise<string>
  getRestaurantSourceById(sourceId: string): Promise<RestaurantSource | null>
  updateRestaurantSource(sourceId: string, ownerId: string, input: Pick<CreateRestaurantSourceInput, 'sourcePlatform' | 'sourceUrl' | 'sourceText' | 'sourceNote' | 'mentionedDishes'>): Promise<void>
  deleteRestaurantSource(sourceId: string, ownerId: string): Promise<void>
}