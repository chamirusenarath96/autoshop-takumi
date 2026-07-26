import { getPayload } from '@/lib/payload'

export type SiteSettingsData = {
  shopName: string
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  instagramUrl: string | null
  instagramHandle: string | null
}

function extractInstagramHandle(url: string): string {
  const match = url.match(/instagram\.com\/([^/?]+)/)
  return match ? `@${match[1]}` : url
}

export async function getSiteSettings(locale: 'ja' | 'en'): Promise<SiteSettingsData> {
  const payload = await getPayload()
  const settings = await payload.findGlobal({ slug: 'site-settings', locale })

  const socialLinks = (settings.socialLinks ?? []) as { platform: string; url: string }[]
  const instagram = socialLinks.find((link) => link.platform === 'instagram')
  const instagramUrl = instagram?.url ?? null

  return {
    shopName: (settings.shopName as string) ?? '',
    contactEmail: (settings.contactEmail as string) ?? null,
    contactPhone: (settings.contactPhone as string) ?? null,
    address: (settings.address as string) ?? null,
    instagramUrl,
    instagramHandle: instagramUrl ? extractInstagramHandle(instagramUrl) : null,
  }
}
