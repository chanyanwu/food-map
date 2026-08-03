import type { CreateRestaurantInput } from '../models/restaurant'

export interface RestaurantRepository {
  createRestaurant(input: CreateRestaurantInput): Promise<void>
}