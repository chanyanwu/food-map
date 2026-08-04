import { createContext } from 'react'
import type { AuthState } from '../models/auth'

export interface AuthContextValue {
  state: AuthState
  actionError: string | null
  isSigningIn: boolean
  signInWithGoogle(intendedRoute?: string): Promise<void>
  signOut(): Promise<void>
  retry(): void
}

export const AuthContext = createContext<AuthContextValue | null>(null)