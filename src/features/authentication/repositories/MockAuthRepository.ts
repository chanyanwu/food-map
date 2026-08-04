import type { AuthUser } from '../models/auth'
import type { AuthRepository, AuthStateListener } from './AuthRepository'

export interface MockAuthRepositoryOptions {
  initialUser?: AuthUser | null
  loading?: boolean
  signInError?: Error
  redirectError?: Error
}

export class MockAuthRepository implements AuthRepository {
  private currentUser: AuthUser | null
  private readonly listeners = new Set<AuthStateListener>()
  private loading: boolean
  private readonly signInError?: Error
  private readonly redirectError?: Error
  completeRedirectSignInCalls = 0

  constructor({ initialUser = null, loading = false, signInError, redirectError }: MockAuthRepositoryOptions = {}) {
    this.currentUser = initialUser
    this.loading = loading
    this.signInError = signInError
    this.redirectError = redirectError
  }

  subscribeToAuthState(listener: AuthStateListener): () => void {
    this.listeners.add(listener)
    if (!this.loading) listener(this.currentUser)
    return () => this.listeners.delete(listener)
  }

  async signInWithGoogle(): Promise<void> {
    if (this.signInError) throw this.signInError
    this.setUser(this.currentUser ?? { id: 'mock-user', displayName: 'Mock User', email: 'mock@example.com', photoURL: null })
  }

  async completeRedirectSignIn(): Promise<void> {
    this.completeRedirectSignInCalls += 1
    if (this.redirectError) throw this.redirectError
  }

  async signOut(): Promise<void> {
    this.setUser(null)
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  resolveLoading(user = this.currentUser): void {
    this.loading = false
    this.setUser(user)
  }

  setUser(user: AuthUser | null): void {
    this.currentUser = user
    this.listeners.forEach(listener => listener(user))
  }
}