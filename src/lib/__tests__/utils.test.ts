import { describe, it, expect } from 'vitest'
import { cn, formatPrice, slugify } from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })

  it('deduplicates tailwind conflicts', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })
})

describe('formatPrice', () => {
  it('formats JPY correctly', () => {
    expect(formatPrice(3500000, 'JPY', 'ja-JP')).toMatch(/3,500,000/)
  })

  it('returns empty string for null price', () => {
    expect(formatPrice(null)).toBe('')
  })

  it('returns empty string for undefined price', () => {
    expect(formatPrice(undefined)).toBe('')
  })
})

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Toyota Supra')).toBe('toyota-supra')
  })

  it('removes special characters', () => {
    expect(slugify('GR86 (2022)')).toBe('gr86-2022')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('-test-')).toBe('test')
  })
})
