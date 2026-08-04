import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where, type DocumentData, type Firestore, type QueryDocumentSnapshot } from 'firebase/firestore'
import type { CreateRestaurantInput, Restaurant, UpdateRestaurantInput } from '../models/restaurant'
import type { RestaurantRepository } from './RestaurantRepository'

export class FirebaseRestaurantRepository implements RestaurantRepository {
  constructor(private readonly firestore: Firestore) {}

  async createRestaurant(input: CreateRestaurantInput): Promise<string> {
    const restaurant = doc(collection(this.firestore, 'restaurants'))
    await setDoc(restaurant, {
      id: restaurant.id,
      ownerId: input.ownerId,
      name: input.name,
      address: input.address,
      category: input.category,
      rating: input.rating,
      notes: input.notes,
      latitude: input.latitude,
      longitude: input.longitude,
      photoURLs: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      schemaVersion: 1
    })
    return restaurant.id
  }

  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    const restaurantsQuery = query(
      collection(this.firestore, 'restaurants'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(restaurantsQuery)
    return snapshot.docs.map(toRestaurant)
  }

  async getRestaurantById(restaurantId: string): Promise<Restaurant | null> {
    const snapshot = await getDoc(doc(this.firestore, 'restaurants', restaurantId))
    return snapshot.exists() ? toRestaurant(snapshot) : null
  }

  async updateRestaurant(restaurantId: string, ownerId: string, input: UpdateRestaurantInput): Promise<void> {
    const restaurant = doc(this.firestore, 'restaurants', restaurantId)
    await this.assertOwner(restaurantId, ownerId)
    await updateDoc(restaurant, { ...input, updatedAt: serverTimestamp() })
  }

  async deleteRestaurant(restaurantId: string, ownerId: string): Promise<void> {
    const restaurant = doc(this.firestore, 'restaurants', restaurantId)
    await this.assertOwner(restaurantId, ownerId)
    await deleteDoc(restaurant)
  }

  private async assertOwner(restaurantId: string, ownerId: string): Promise<void> {
    const restaurant = await this.getRestaurantById(restaurantId)
    if (!restaurant) throw new Error('restaurant/not-found')
    if (restaurant.ownerId !== ownerId) throw new Error('restaurant/permission-denied')
  }
}

function toRestaurant(snapshot: QueryDocumentSnapshot<DocumentData>): Restaurant {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    ownerId: data.ownerId,
    name: data.name,
    address: data.address,
    category: data.category,
    rating: data.rating,
    notes: data.notes,
    latitude: toNullableNumber(data.latitude),
    longitude: toNullableNumber(data.longitude),
    photoURLs: data.photoURLs,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    schemaVersion: data.schemaVersion
  }
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}