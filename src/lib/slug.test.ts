import { describe, it, expect } from 'vitest'
import { generateUniqueSlug } from '@/lib/slug'

describe('generateUniqueSlug', () => {
  it('throws on a blank title', () => {
    expect(() => generateUniqueSlug('', [])).toThrow()
  })

  it('throws on a whitespace-only title', () => {
    expect(() => generateUniqueSlug('   ', [])).toThrow()
  })

  it('falls back to a fixed base when a non-blank title slugifies to nothing', () => {
    expect(generateUniqueSlug('★★★', [])).toBe('vehicle')
  })

  it('returns the plain slugified title when there is no collision', () => {
    expect(generateUniqueSlug('1999 Toyota Supra RZ', [])).toBe('1999-toyota-supra-rz')
  })

  it('appends -2 on a single collision', () => {
    expect(generateUniqueSlug('1999 Toyota Supra RZ', ['1999-toyota-supra-rz'])).toBe('1999-toyota-supra-rz-2')
  })

  it('appends the next free numeric suffix across multiple sequential collisions', () => {
    const existing = ['1999-toyota-supra-rz', '1999-toyota-supra-rz-2', '1999-toyota-supra-rz-3']
    expect(generateUniqueSlug('1999 Toyota Supra RZ', existing)).toBe('1999-toyota-supra-rz-4')
  })

  it('is not confused by an unrelated existing slug', () => {
    expect(generateUniqueSlug('1999 Toyota Supra RZ', ['some-other-vehicle'])).toBe('1999-toyota-supra-rz')
  })
})
