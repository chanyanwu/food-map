import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FirebaseAuthRepository } from './FirebaseAuthRepository'
import type { SignInEnvironment } from '../services/signInEnvironment'

const firebaseAuth = vi.hoisted(() => ({ signInWithPopup: vi.fn(), signInWithRedirect: vi.fn(), getRedirectResult: vi.fn(), onAuthStateChanged: vi.fn(), signOut: vi.fn(), GoogleAuthProvider: vi.fn() }))
vi.mock('firebase/auth', () => firebaseAuth)

const desktop: SignInEnvironment = { isStandalone: false, hasCoarsePointer: false, isSmallTouchDevice: false, isIos: false, userAgent: 'Mozilla/5.0' }
const mobile: SignInEnvironment = { ...desktop, isSmallTouchDevice: true, hasCoarsePointer: true }

describe('FirebaseAuthRepository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses a popup on a suitable desktop browser without redirecting', async () => {
    firebaseAuth.signInWithPopup.mockResolvedValue(undefined)
    const repository = new FirebaseAuthRepository({ currentUser: null } as never, () => desktop)
    await repository.signInWithGoogle()
    expect(firebaseAuth.signInWithPopup).toHaveBeenCalledOnce()
    expect(firebaseAuth.signInWithRedirect).not.toHaveBeenCalled()
  })

  it('uses redirect on mobile-like browsers', async () => {
    firebaseAuth.signInWithRedirect.mockResolvedValue(undefined)
    const repository = new FirebaseAuthRepository({ currentUser: null } as never, () => mobile)
    await repository.signInWithGoogle()
    expect(firebaseAuth.signInWithRedirect).toHaveBeenCalledOnce()
    expect(firebaseAuth.signInWithPopup).not.toHaveBeenCalled()
  })

  it('falls back to redirect when a desktop popup is blocked', async () => {
    firebaseAuth.signInWithPopup.mockRejectedValue({ code: 'auth/popup-blocked' })
    firebaseAuth.signInWithRedirect.mockResolvedValue(undefined)
    const repository = new FirebaseAuthRepository({ currentUser: null } as never, () => desktop)
    await repository.signInWithGoogle()
    expect(firebaseAuth.signInWithPopup).toHaveBeenCalledOnce()
    expect(firebaseAuth.signInWithRedirect).toHaveBeenCalledOnce()
  })

  it('treats an empty redirect result as successful completion', async () => {
    firebaseAuth.getRedirectResult.mockResolvedValue(null)
    const repository = new FirebaseAuthRepository({ currentUser: null } as never, () => desktop)
    await expect(repository.completeRedirectSignIn()).resolves.toBeUndefined()
  })
})