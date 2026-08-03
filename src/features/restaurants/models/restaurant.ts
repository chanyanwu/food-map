export interface Restaurant {
  id: string
  ownerId: string
  name: string
  address: string
  category: string
  rating: number | null
  notes: string
  latitude: number | null
  longitude: number | null
  photoURLs: string[]
  createdAt: Date
  updatedAt: Date
  schemaVersion: 1
}

export interface CreateRestaurantInput {
  ownerId: string
  name: string
  address: string
  category: string
  rating: number | null
  notes: string
}