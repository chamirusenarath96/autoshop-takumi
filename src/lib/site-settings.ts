import { getPayload } from '@/lib/payload'
import { resolveLocalizedField } from '@/lib/content-locale'

export type SiteSettingsData = {
  shopName: string
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  businessHours: string | null
  instagramUrl: string | null
  instagramHandle: string | null
}

function extractInstagramHandle(url: string): string {
  const match = url.match(/instagram\.com\/([^/?]+)/)
  return match ? `@${match[1]}` : url
}

export async function getSiteSettings(locale: 'ja' | 'en'): Promise<SiteSettingsData> {
  const payload = await getPayload()
  // `locale` is still passed — required for `businessHours`, which remains `localized: true`
  // (out of scope for specs/003-remove-payload-localization). It has no effect on
  // shopNameJa/En or addressJa/En below, since neither is a localized field anymore.
  const settings = await payload.findGlobal({ slug: 'site-settings', locale })

  const socialLinks = (settings.socialLinks ?? []) as { platform: string; url: string }[]
  const instagram = socialLinks.find((link) => link.platform === 'instagram')
  const instagramUrl = instagram?.url ?? null

  return {
    shopName: resolveLocalizedField(settings.shopNameJa as string, settings.shopNameEn as string, locale) ?? '',
    contactEmail: (settings.contactEmail as string) ?? null,
    contactPhone: (settings.contactPhone as string) ?? null,
    address: resolveLocalizedField(settings.addressJa as string, settings.addressEn as string, locale) ?? null,
    businessHours: (settings.businessHours as string) ?? null,
    instagramUrl,
    instagramHandle: instagramUrl ? extractInstagramHandle(instagramUrl) : null,
  }
}
