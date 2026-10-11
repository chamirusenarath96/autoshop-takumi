import { getPayload } from '@/lib/payload'
import { resolveLocalizedField } from '@/lib/content-locale'

export type GalleryPhoto = {
  id: string
  /** ~800 px wide — grid tiles and the landing collage. */
  thumb: string
  /** ~1600 px wide — lightbox. */
  full: string
  alt: string
}

type MediaDoc = {
  url?: string | null
  altJa?: string | null
  altEn?: string | null
  sizes?: { card?: { url?: string | null }; detail?: { url?: string | null } }
}

export function toGalleryPhotos(rows: unknown, locale: 'ja' | 'en'): GalleryPhoto[] {
  if (!Array.isArray(rows)) return []
  const photos: GalleryPhoto[] = []
  rows.forEach((row: any, i) => {
    const media = row?.image as MediaDoc | null
    if (!media || typeof media !== 'object' || !media.url) return
    photos.push({
      id: String(row.id ?? i),
      thumb: media.sizes?.card?.url ?? media.url,
      full: media.sizes?.detail?.url ?? media.url,
      alt: resolveLocalizedField(media.altJa, media.altEn, locale) ?? '',
    })
  })
  return photos
}

/** Reads the Gallery global. A CMS failure (e.g. table not yet migrated) yields an empty list. */
export async function getGalleryPhotos(locale: 'ja' | 'en'): Promise<GalleryPhoto[]> {
  try {
    const payload = await getPayload()
    const gallery = await payload.findGlobal({ slug: 'gallery', locale })
    return toGalleryPhotos(gallery.photos, locale)
  } catch (error) {
    console.error('Gallery read failed:', error)
    return []
  }
}
