import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves NEXT_PUBLIC_SITE_URL into a URL for Next.js's `metadataBase`. Tries the
 * value as-is, then with an "https://" prefix (a bare domain like "example.com" is a
 * plausible misconfiguration), and falls back to localhost rather than letting a
 * malformed env var throw and crash the entire build.
 */
export function resolveMetadataBase(siteUrl: string | undefined): URL {
  const fallback = 'http://localhost:3000'
  for (const candidate of [siteUrl, siteUrl ? `https://${siteUrl}` : undefined, fallback]) {
    if (!candidate) continue
    try {
      return new URL(candidate)
    } catch {
      continue
    }
  }
  return new URL(fallback)
}

/** Formats a single already-resolved price in a known currency (JPY or USD). */
export function formatPrice(price: number | null | undefined, currency = 'JPY', locale = 'ja-JP'): string {
  if (typeof price !== 'number' || !Number.isFinite(price)) return ''
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Formats a vehicle's price display: currency-driven, not locale-driven (spec FR-004) — shows
 * whichever of priceJpy/priceUsd is set (both, if both are), identically regardless of site
 * locale. priceOnRequest suppresses both regardless of their values.
 */
export function formatVehiclePrices(
  priceJpy: number | null | undefined,
  priceUsd: number | null | undefined,
  priceOnRequest: boolean | null | undefined,
  intlLocale = 'ja-JP',
): string[] {
  if (priceOnRequest) return []
  return [formatPrice(priceJpy, 'JPY', intlLocale), formatPrice(priceUsd, 'USD', intlLocale)].filter(Boolean)
}

/** Composes the final price display string, substituting `priceOnRequestLabel` when set. */
export function formatVehiclePriceDisplay(
  priceJpy: number | null | undefined,
  priceUsd: number | null | undefined,
  priceOnRequest: boolean | null | undefined,
  intlLocale: string,
  priceOnRequestLabel: string,
): string {
  return priceOnRequest
    ? priceOnRequestLabel
    : formatVehiclePrices(priceJpy, priceUsd, priceOnRequest, intlLocale).join(' / ')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
