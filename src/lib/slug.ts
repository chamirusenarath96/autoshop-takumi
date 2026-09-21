import { slugify } from '@/lib/utils'

const EMPTY_TITLE_FALLBACK_BASE = 'vehicle'

/**
 * Derives a unique, URL-safe slug from a vehicle title, disambiguating against
 * `existingSlugs` with an incrementing numeric suffix (-2, -3, ...). Throws on a
 * blank/whitespace-only title (a caller bug — collections must never pass one
 * through); a non-blank title that itself slugifies to nothing (e.g. symbols-only)
 * falls back to a fixed base instead of erroring.
 */
export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
  if (title.trim().length === 0) {
    throw new Error('generateUniqueSlug: title must not be blank')
  }

  const base = slugify(title) || EMPTY_TITLE_FALLBACK_BASE
  const taken = new Set(existingSlugs)

  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1
  }
  return `${base}-${suffix}`
}
