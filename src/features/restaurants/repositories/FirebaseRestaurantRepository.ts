import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, where, type DocumentData, type Firestore, type QueryDocumentSnapshot } from 'firebase/firestore'
import type { CreateRestaurantInput, Restaurant } from '../models/restaurant'
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

  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    const restaurantsQuery = query(
      collection(this.firestore, 'restaurants'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(restaurantsQuery)
    return snapshot.docs.map(toRestaurant)
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
    latitude: data.latitude,
    longitude: data.longitude,
    photoURLs: data.photoURLs,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    schemaVersion: data.schemaVersion
  }
}