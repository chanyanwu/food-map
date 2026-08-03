export interface AuthUser {
  id: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

export type AuthState =
  | { kind: 'loading' }
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: 'unauthenticated' }
  | { kind: 'error'; message: string }