import { describe, expect, it } from 'vitest'
import { calculateDistanceKilometers, formatDistance } from './distance'

describe('distance utilities', () => {
  it('calculates a known straight-line distance', () => {
    expect(calculateDistanceKilometers({ latitude: 25.033, longitude: 121.5654 }, { latitude: 25.0478, longitude: 121.5319 })).toBeCloseTo(3.75, 1)
  })

  it('rejects missing or invalid coordinates', () => {
    expect(calculateDistanceKilometers({ latitude: null, longitude: 121 }, { latitude: 25, longitude: 121 })).toBeNull()
    expect(calculateDistanceKilometers({ latitude: 91, longitude: 121 }, { latitude: 25, longitude: 121 })).toBeNull()
  })

  it('formats metres below one kilometre and kilometres otherwise', () => {
    expect(formatDistance(0.874)).toBe('874 公尺')
    expect(formatDistance(1)).toBe('1.0 公里')
    expect(formatDistance(Number.NaN)).toBe('')
  })
})