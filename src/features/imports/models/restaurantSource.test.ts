import { describe, expect, it } from 'vitest'
import { maximumMentionedDishes, validateMentionedDishes } from './restaurantSource'

describe('validateMentionedDishes', () => {
  it('accepts up to ten non-empty dishes of one hundred characters', () => {
    expect(validateMentionedDishes(Array.from({ length: maximumMentionedDishes }, () => 'x'.repeat(100)))).toBeNull()
  })

  it('rejects excessive, empty, whitespace-only, and overlong dishes', () => {
    expect(validateMentionedDishes(Array.from({ length: maximumMentionedDishes + 1 }, () => 'Dish'))).toContain('最多 10 項')
    expect(validateMentionedDishes([''])).toContain('最多 10 項')
    expect(validateMentionedDishes(['   '])).toContain('最多 10 項')
    expect(validateMentionedDishes(['x'.repeat(101)])).toContain('最多 10 項')
  })
})