import type { CreateRestaurantInput, Restaurant } from '../models/restaurant'

export interface RestaurantRepository {
  createRestaurant(input: CreateRestaurantInput): Promise<void>
  getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]>
}