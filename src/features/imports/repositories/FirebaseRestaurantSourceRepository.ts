import { collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, type DocumentData, type Firestore, type QueryDocumentSnapshot } from 'firebase/firestore'
import { validateMentionedDishes, type CreateRestaurantSourceInput, type RestaurantSource } from '../models/restaurantSource'
import type { RestaurantSourceRepository } from './RestaurantSourceRepository'

export class FirebaseRestaurantSourceRepository implements RestaurantSourceRepository {
  constructor(private readonly firestore: Firestore) {}

  async createRestaurantSource(input: CreateRestaurantSourceInput): Promise<string> {
    assertValidMentionedDishes(input.mentionedDishes)
    const source = doc(collection(this.firestore, 'restaurantSources'))
    await setDoc(source, { id: source.id, ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), schemaVersion: 1 })
    return source.id
  }

  async getRestaurantSourceById(sourceId: string): Promise<RestaurantSource | null> {
    const snapshot = await getDoc(doc(this.firestore, 'restaurantSources', sourceId))
    return snapshot.exists() ? toRestaurantSource(snapshot) : null
  }

  async updateRestaurantSource(sourceId: string, ownerId: string, input: Pick<CreateRestaurantSourceInput, 'sourcePlatform' | 'sourceUrl' | 'sourceText' | 'sourceNote' | 'mentionedDishes'>): Promise<void> {
    assertValidMentionedDishes(input.mentionedDishes)
    const source = await this.getRestaurantSourceById(sourceId)
    if (!source) throw new Error('restaurant-source/not-found')
    if (source.ownerId !== ownerId) throw new Error('restaurant-source/permission-denied')
    await updateDoc(doc(this.firestore, 'restaurantSources', sourceId), { ...input, updatedAt: serverTimestamp() })
  }

  async deleteRestaurantSource(sourceId: string, ownerId: string): Promise<void> {
    const source = await this.getRestaurantSourceById(sourceId)
    if (!source) throw new Error('restaurant-source/not-found')
    if (source.ownerId !== ownerId) throw new Error('restaurant-source/permission-denied')
    await deleteDoc(doc(this.firestore, 'restaurantSources', sourceId))
  }
}

function toRestaurantSource(snapshot: QueryDocumentSnapshot<DocumentData>): RestaurantSource {
  const data = snapshot.data()
  const sourceUrl = typeof data.sourceUrl === 'string' ? data.sourceUrl : null
  return { id: snapshot.id, restaurantId: typeof data.restaurantId === 'string' ? data.restaurantId : '', ownerId: typeof data.ownerId === 'string' ? data.ownerId : '', sourceType: 'social-content', sourcePlatform: isSourcePlatform(data.sourcePlatform) ? data.sourcePlatform : '其他', sourceUrl, sourceText: typeof data.sourceText === 'string' ? data.sourceText : '', sourceNote: typeof data.sourceNote === 'string' ? data.sourceNote : '', mentionedDishes: Array.isArray(data.mentionedDishes) ? data.mentionedDishes.filter((dish): dish is string => typeof dish === 'string') : [], createdAt: data.createdAt?.toDate?.() ?? new Date(0), updatedAt: data.updatedAt?.toDate?.() ?? new Date(0), schemaVersion: 1 }
}

function isSourcePlatform(value: unknown): value is RestaurantSource['sourcePlatform'] {
  return value === 'Instagram' || value === 'Threads' || value === 'Facebook' || value === 'TikTok' || value === 'YouTube' || value === '小紅書' || value === '部落格' || value === '其他'
}

function assertValidMentionedDishes(mentionedDishes: string[]): void {
  if (validateMentionedDishes(mentionedDishes)) throw new Error('restaurant-source/invalid-mentioned-dishes')
}