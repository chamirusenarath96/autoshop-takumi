import { describe, it, expect } from 'vitest'
import { cn, formatPrice, formatVehiclePriceDisplay, formatVehiclePrices, resolveMetadataBase, slugify } from '../utils'

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

  it('formats a price of exactly 0 rather than treating it as absent', () => {
    expect(formatPrice(0, 'JPY', 'ja-JP')).toMatch(/0/)
  })

  it('formats USD correctly', () => {
    expect(formatPrice(30000, 'USD', 'en-US')).toMatch(/30,000/)
  })
})

describe('formatVehiclePrices', () => {
  it('shows only the JPY price when only priceJpy is set', () => {
    expect(formatVehiclePrices(4500000, undefined, false)).toEqual([expect.stringMatching(/4,500,000/)])
  })

  it('shows only the USD price when only priceUsd is set', () => {
    expect(formatVehiclePrices(undefined, 30000, false, 'en-US')).toEqual([expect.stringMatching(/30,000/)])
  })

  it('shows both prices when both are set, independent of any conversion', () => {
    const parts = formatVehiclePrices(4500000, 30000, false)
    expect(parts).toHaveLength(2)
    expect(parts[0]).toMatch(/4,500,000/)
    expect(parts[1]).toMatch(/30,000/)
  })

  it('suppresses both prices when priceOnRequest is true, regardless of stored values', () => {
    expect(formatVehiclePrices(4500000, 30000, true)).toEqual([])
  })

  it('returns an empty array when neither price is set and priceOnRequest is false', () => {
    expect(formatVehiclePrices(undefined, undefined, false)).toEqual([])
  })

  it('treats a JPY price of exactly 0 as present', () => {
    expect(formatVehiclePrices(0, undefined, false)).toEqual([expect.stringMatching(/0/)])
  })
})

describe('formatVehiclePriceDisplay', () => {
  it('returns the priceOnRequest label when priceOnRequest is true, ignoring stored prices', () => {
    expect(formatVehiclePriceDisplay(4500000, 30000, true, 'ja-JP', '要お問い合わせ')).toBe('要お問い合わせ')
  })

  it('joins the formatted price parts with " / " when priceOnRequest is false', () => {
    const display = formatVehiclePriceDisplay(4500000, 30000, false, 'ja-JP', 'Contact for price')
    expect(display).toMatch(/4,500,000/)
    expect(display).toMatch(/30,000/)
    expect(display).toContain(' / ')
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

describe('resolveMetadataBase', () => {
  it('uses a well-formed absolute URL as-is', () => {
    expect(resolveMetadataBase('https://autoshoptakumi.example').href).toBe('https://autoshoptakumi.example/')
  })

  it('falls back to localhost when undefined', () => {
    expect(resolveMetadataBase(undefined).href).toBe('http://localhost:3000/')
  })

  it('falls back to localhost when empty', () => {
    expect(resolveMetadataBase('').href).toBe('http://localhost:3000/')
  })

  it('recovers a bare domain (no scheme) by assuming https', () => {
    expect(resolveMetadataBase('autoshoptakumi.example').href).toBe('https://autoshoptakumi.example/')
  })

  it('falls back to localhost instead of throwing on a genuinely malformed value', () => {
    expect(resolveMetadataBase('not a url at all').href).toBe('http://localhost:3000/')
  })
})
