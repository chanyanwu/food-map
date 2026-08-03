import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { firebaseWebConfig, isFirebaseConfigured } from '../config/firebase'
import { createFirebaseServices } from '../../core/firebase/firebaseClient'
import type { AuthState } from '../../features/authentication/models/auth'
import { FirebaseAuthRepository } from '../../features/authentication/repositories/FirebaseAuthRepository'
import { FirebaseUserProfileRepository } from '../../features/authentication/repositories/FirebaseUserProfileRepository'
import type { AuthRepository } from '../../features/authentication/repositories/AuthRepository'
import type { UserProfileRepository } from '../../features/authentication/repositories/UserProfileRepository'
import { toFriendlyAuthError } from '../../features/authentication/services/authErrorMessage'
import { AuthContext, type AuthContextValue } from '../../features/authentication/context/authContext'

interface AuthProviderProps {
  children: ReactNode
  repository?: AuthRepository
  profileRepository?: UserProfileRepository
}

export function AuthProvider({ children, repository, profileRepository }: AuthProviderProps) {
  const defaults = useMemo(() => {
    if (repository || !isFirebaseConfigured()) return null
    const services = createFirebaseServices(firebaseWebConfig)
    return {
      repository: new FirebaseAuthRepository(services.auth),
      profileRepository: new FirebaseUserProfileRepository(services.firestore)
    }
  }, [repository])
  const activeRepository = repository ?? defaults?.repository
  const activeProfileRepository = profileRepository ?? defaults?.profileRepository
  const [state, setState] = useState<AuthState>(() => activeRepository ? { kind: 'loading' } : { kind: 'error', message: 'Firebase 尚未設定。請設定 VITE_FIREBASE_* 環境變數後重新載入。' })
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!activeRepository) return
    let active = true
    setState({ kind: 'loading' })
    void activeRepository.completeRedirectSignIn?.().catch(error => {
      if (active) setActionError(toFriendlyAuthError(error))
    })
    const unsubscribe = activeRepository.subscribeToAuthState(user => {
      if (!active) return
      setState(user ? { kind: 'authenticated', user } : { kind: 'unauthenticated' })
      if (user && activeProfileRepository) {
        void activeProfileRepository.upsertProfile(user).catch(() => {
          if (active) setActionError('登入成功，但個人資料暫時無法同步。請稍後重新整理再試。')
        })
      }
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [activeProfileRepository, activeRepository, attempt])

  const value: AuthContextValue = {
    state,
    actionError,
    isSigningIn,
    async signInWithGoogle() {
      if (!activeRepository) return
      setActionError(null)
      setIsSigningIn(true)
      try {
        await activeRepository.signInWithGoogle()
      } catch (error) {
        setActionError(toFriendlyAuthError(error))
      } finally {
        setIsSigningIn(false)
      }
    },
    async signOut() {
      if (!activeRepository) return
      try {
        await activeRepository.signOut()
      } catch (error) {
        setActionError(toFriendlyAuthError(error))
      }
    },
    retry() {
      if (activeRepository) {
        setActionError(null)
        setAttempt(value => value + 1)
      }
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
