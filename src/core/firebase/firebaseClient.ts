import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'
import type { FirebaseWebConfig } from '../../app/config/firebase'

export interface FirebaseServices {
  auth: Auth
  firestore: Firestore
  storage: FirebaseStorage
}

const emulatorApps = new WeakSet<FirebaseApp>()

export function shouldUseFirebaseEmulator(environment: Pick<ImportMetaEnv, 'DEV' | 'VITE_USE_FIREBASE_EMULATOR'> = import.meta.env): boolean {
  return environment.DEV && environment.VITE_USE_FIREBASE_EMULATOR === 'true'
}

export function createFirebaseServices(config: FirebaseWebConfig, useEmulator = shouldUseFirebaseEmulator()): FirebaseServices {
  const app = getApps().length === 0 ? initializeApp(config) : getApp()
  const auth = getAuth(app)
  const firestore = getFirestore(app)
  const storage = getStorage(app)

  if (useEmulator && !emulatorApps.has(app)) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
    connectStorageEmulator(storage, '127.0.0.1', 9199)
    emulatorApps.add(app)
  }

  return { auth, firestore, storage }
}