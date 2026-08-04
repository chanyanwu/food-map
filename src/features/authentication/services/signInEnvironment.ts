export interface SignInEnvironment {
  isStandalone: boolean
  hasCoarsePointer: boolean
  isSmallTouchDevice: boolean
  isIos: boolean
  userAgent: string
}

export function currentSignInEnvironment(): SignInEnvironment {
  const media = (query: string) => typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  const userAgent = navigator.userAgent
  return {
    isStandalone: media('(display-mode: standalone)') || ('standalone' in navigator && navigator.standalone === true),
    hasCoarsePointer: media('(pointer: coarse)'),
    isSmallTouchDevice: media('(max-width: 768px)') && navigator.maxTouchPoints > 0,
    isIos: /iPad|iPhone|iPod/.test(userAgent),
    userAgent
  }
}

export function prefersRedirectSignIn(environment: SignInEnvironment = currentSignInEnvironment()): boolean {
  return environment.isStandalone || environment.isIos || environment.isSmallTouchDevice || environment.hasCoarsePointer
}

export function isInAppBrowser(environment: SignInEnvironment = currentSignInEnvironment()): boolean {
  return /Line\//i.test(environment.userAgent) || /FBAN|FBAV|Instagram/i.test(environment.userAgent)
}