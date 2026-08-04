import { describe, expect, it } from 'vitest'
import { maximumImageBytes, validateImages } from './imageValidation'

describe('image validation', () => {
  it('accepts JPEG, PNG, and WebP screenshots', () => {
    expect(validateImages(['image/jpeg', 'image/png', 'image/webp'].map((type, index) => new File(['image'], `${index}.${type.split('/')[1]}`, { type })))).toBeNull()
  })

  it('rejects unsupported formats, oversized files, and too many images', () => {
    expect(validateImages([new File(['x'], 'image.gif', { type: 'image/gif' })])).toContain('JPEG、PNG 或 WebP')
    expect(validateImages([new File([new Uint8Array(maximumImageBytes + 1)], 'large.png', { type: 'image/png' })])).toContain('10 MB')
    expect(validateImages([new File(['x'], 'one.png', { type: 'image/png' })], 5)).toContain('最多')
  })
})