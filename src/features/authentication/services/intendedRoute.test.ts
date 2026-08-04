import { beforeEach, describe, expect, it } from 'vitest'
import { consumeIntendedRoute, saveIntendedRoute } from './intendedRoute'

describe('intended route storage', () => {
  beforeEach(() => sessionStorage.clear())

  it('persists and consumes only safe internal routes', () => {
    saveIntendedRoute('/restaurants/import?draft=1')
    expect(consumeIntendedRoute()).toBe('/restaurants/import?draft=1')
    expect(consumeIntendedRoute()).toBeNull()
  })

  it('does not persist external or protocol-relative destinations', () => {
    saveIntendedRoute('https://example.com')
    saveIntendedRoute('//example.com')
    expect(consumeIntendedRoute()).toBeNull()
  })
})