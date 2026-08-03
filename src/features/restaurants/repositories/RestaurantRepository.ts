import type { CreateRestaurantInput, Restaurant, UpdateRestaurantInput } from '../models/restaurant'

export interface RestaurantRepository {
  createRestaurant(input: CreateRestaurantInput): Promise<void>
  getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]>
  getRestaurantById(restaurantId: string): Promise<Restaurant | null>
  updateRestaurant(restaurantId: string, ownerId: string, input: UpdateRestaurantInput): Promise<void>
  deleteRestaurant(restaurantId: string, ownerId: string): Promise<void>
}