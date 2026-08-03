export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  appId: string
  messagingSenderId?: string
}

const requiredValue = (name: keyof ImportMetaEnv): string => import.meta.env[name] ?? ''

export const firebaseWebConfig: FirebaseWebConfig = {
  apiKey: requiredValue('VITE_FIREBASE_API_KEY'),
  authDomain: requiredValue('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requiredValue('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requiredValue('VITE_FIREBASE_STORAGE_BUCKET'),
  appId: requiredValue('VITE_FIREBASE_APP_ID'),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
}

export function isFirebaseConfigured(config = firebaseWebConfig): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.storageBucket && config.appId)
}