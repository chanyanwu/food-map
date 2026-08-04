import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User
} from 'firebase/auth'
import type { AuthUser } from '../models/auth'
import type { AuthRepository, AuthStateListener } from './AuthRepository'
import { currentSignInEnvironment, prefersRedirectSignIn, type SignInEnvironment } from '../services/signInEnvironment'

function toAuthUser(user: User): AuthUser {
  return { id: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL }
}

function isPopupFallbackError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error
    && (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request')
}

export class FirebaseAuthRepository implements AuthRepository {
  private readonly provider = new GoogleAuthProvider()

  constructor(private readonly auth: Auth, private readonly environment: () => SignInEnvironment = currentSignInEnvironment) {}

  subscribeToAuthState(listener: AuthStateListener): () => void {
    return onAuthStateChanged(this.auth, user => listener(user ? toAuthUser(user) : null))
  }

  async completeRedirectSignIn(): Promise<void> {
    await getRedirectResult(this.auth)
  }

  async signInWithGoogle(): Promise<void> {
    if (prefersRedirectSignIn(this.environment())) {
      await signInWithRedirect(this.auth, this.provider)
      return
    }

    try {
      await signInWithPopup(this.auth, this.provider)
    } catch (error) {
      if (isPopupFallbackError(error)) {
        await signInWithRedirect(this.auth, this.provider)
        return
      }
      throw error
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth)
  }

  getCurrentUser(): AuthUser | null {
    return this.auth.currentUser ? toAuthUser(this.auth.currentUser) : null
  }
}