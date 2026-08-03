import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore'
import type { AuthUser } from '../models/auth'
import type { UserProfileRepository } from './UserProfileRepository'

export class FirebaseUserProfileRepository implements UserProfileRepository {
  constructor(private readonly firestore: Firestore) {}

  async upsertProfile(user: AuthUser): Promise<void> {
    const profile = doc(this.firestore, 'users', user.id)
    await runTransaction(this.firestore, async transaction => {
      const current = await transaction.get(profile)
      const data = {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        updatedAt: serverTimestamp(),
        schemaVersion: 1
      }
      transaction.set(profile, current.exists() ? data : { ...data, createdAt: serverTimestamp() }, { merge: true })
    })
  }
}