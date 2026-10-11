import { describe, it, expect } from 'vitest'
import { toGalleryPhotos } from '../gallery'

const media = (over: Record<string, unknown> = {}) => ({
  url: '/api/media/file/a.jpg',
  altJa: 'ja alt',
  altEn: 'en alt',
  sizes: { card: { url: '/api/media/file/a-800.jpg' }, detail: { url: '/api/media/file/a-1600.jpg' } },
  ...over,
})

describe('toGalleryPhotos', () => {
  it('maps rows to thumb/full/alt using the sized variants', () => {
    const [photo] = toGalleryPhotos([{ id: 'x1', image: media() }], 'en')
    expect(photo).toEqual({ id: 'x1', thumb: '/api/media/file/a-800.jpg', full: '/api/media/file/a-1600.jpg', alt: 'en alt' })
  })

  it('falls back to the original url when size variants are missing', () => {
    const [photo] = toGalleryPhotos([{ id: 'x1', image: media({ sizes: undefined }) }], 'en')
    expect(photo.thumb).toBe('/api/media/file/a.jpg')
    expect(photo.full).toBe('/api/media/file/a.jpg')
  })

  it('uses the Japanese alt text on the ja locale', () => {
    expect(toGalleryPhotos([{ id: '1', image: media() }], 'ja')[0].alt).toBe('ja alt')
  })

  it('skips rows whose image is missing or unpopulated (a bare id)', () => {
    const photos = toGalleryPhotos([{ id: '1', image: 7 }, { id: '2', image: null }, { id: '3', image: media() }], 'en')
    expect(photos).toHaveLength(1)
    expect(photos[0].id).toBe('3')
  })

  it('returns an empty list for a non-array value', () => {
    expect(toGalleryPhotos(undefined, 'en')).toEqual([])
    expect(toGalleryPhotos(null, 'en')).toEqual([])
  })
})
