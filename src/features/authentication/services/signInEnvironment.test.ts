import { describe, expect, it } from 'vitest'
import { isInAppBrowser, prefersRedirectSignIn, type SignInEnvironment } from './signInEnvironment'

const desktop: SignInEnvironment = { isStandalone: false, hasCoarsePointer: false, isSmallTouchDevice: false, isIos: false, userAgent: 'Mozilla/5.0' }

describe('sign-in environment', () => {
  it('prefers redirect for standalone, iOS, and small touch devices', () => {
    expect(prefersRedirectSignIn(desktop)).toBe(false)
    expect(prefersRedirectSignIn({ ...desktop, isStandalone: true })).toBe(true)
    expect(prefersRedirectSignIn({ ...desktop, isIos: true })).toBe(true)
    expect(prefersRedirectSignIn({ ...desktop, isSmallTouchDevice: true })).toBe(true)
  })

  it('detects common in-app browser user agents for a warning only', () => {
    expect(isInAppBrowser({ ...desktop, userAgent: 'Line/13.1' })).toBe(true)
    expect(isInAppBrowser({ ...desktop, userAgent: 'Instagram 300.0' })).toBe(true)
    expect(isInAppBrowser(desktop)).toBe(false)
  })
})