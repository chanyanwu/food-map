import { collection, doc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import type { CreateRestaurantInput } from '../models/restaurant'
import type { RestaurantRepository } from './RestaurantRepository'

export class FirebaseRestaurantRepository implements RestaurantRepository {
  constructor(private readonly firestore: Firestore) {}

  async createRestaurant(input: CreateRestaurantInput): Promise<void> {
    const restaurant = doc(collection(this.firestore, 'restaurants'))
    await setDoc(restaurant, {
      id: restaurant.id,
      ownerId: input.ownerId,
      name: input.name,
      address: input.address,
      category: input.category,
      rating: input.rating,
      notes: input.notes,
      latitude: null,
      longitude: null,
      photoURLs: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      schemaVersion: 1
    })
  }
}