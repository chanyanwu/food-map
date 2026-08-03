import { describe, expect, it } from 'vitest'
import { shouldUseFirebaseEmulator } from './firebaseClient'

describe('shouldUseFirebaseEmulator', () => {
  it('only enables the emulator for an explicit development flag', () => {
    expect(shouldUseFirebaseEmulator({ DEV: true, VITE_USE_FIREBASE_EMULATOR: 'true' })).toBe(true)
    expect(shouldUseFirebaseEmulator({ DEV: true, VITE_USE_FIREBASE_EMULATOR: 'false' })).toBe(false)
    expect(shouldUseFirebaseEmulator({ DEV: false, VITE_USE_FIREBASE_EMULATOR: 'true' })).toBe(false)
  })
})