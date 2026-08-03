import type { AuthUser } from '../models/auth'

export type AuthStateListener = (user: AuthUser | null) => void

export interface AuthRepository {
  subscribeToAuthState(listener: AuthStateListener): () => void
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
  getCurrentUser(): AuthUser | null
  completeRedirectSignIn?(): Promise<void>
}