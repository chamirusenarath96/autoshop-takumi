import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-settings'
import { getPayload } from '@/lib/payload'
import { ValueItem } from '@/components/about/ValueItem'
import { TeamMemberCard } from '@/components/about/TeamMemberCard'
import { FacilityGallery } from '@/components/about/FacilityGallery'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ja' ? '会社概要 | Autoshop Takumi' : 'About | Autoshop Takumi',
    description:
      locale === 'ja'
        ? '仙台市のオートショップ匠。車の販売・整備・車検・カスタムのご相談はお気軽に。'
        : 'Autoshop Takumi — Sendai-based auto shop specialising in vehicle sales, maintenance, inspections and custom work.',
    alternates: {
      languages: {
        en: '/en/about',
        ja: '/ja/about',
      },
    },
  }
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('about')
  const siteSettings = await getSiteSettings(locale as 'ja' | 'en')
  const payload = await getPayload()
  const about = await payload.findGlobal({ slug: 'about', locale: locale as 'ja' | 'en' })

  const storyParagraphs = ((about.storyParagraphs as any[]) ?? []).map((p) => p.text)
  const values = (about.values as any[]) ?? []
  const team = (about.team as any[]) ?? []
  const facility = (about.facility as any[]) ?? []

  const profileRows: { label: string; value: string | null; link?: string | null }[] = [
    { label: t('fields.companyName'), value: siteSettings.shopName, link: null },
    { label: t('fields.address'), value: siteSettings.address, link: null },
    { label: t('fields.phone'), value: siteSettings.contactPhone, link: null },
    { label: t('fields.email'), value: siteSettings.contactEmail, link: null },
    { label: t('fields.hours'), value: siteSettings.businessHours ?? t('hoursValue'), link: null },
    {
      label: t('fields.instagram'),
      value: siteSettings.instagramHandle,
      link: siteSettings.instagramUrl,
    },
  ].filter((row) => row.value)

  return (
    <div>
      {/* Hero */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="takumi-eyebrow text-primary mb-4">{t('title')}</p>
          <h1 className="takumi-display text-4xl sm:text-5xl mb-4">{about.heroHeading || t('title')}</h1>
          {about.heroSubheading && (
            <p className="text-lg text-white/70 max-w-xl mx-auto">{about.heroSubheading}</p>
          )}
        </div>
      </section>

      {/* About story */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-12 h-1 bg-primary mb-6" />
            <h2 className="takumi-display text-3xl mb-6">{about.storyHeading}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {storyParagraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center bg-muted rounded-lg p-12 overflow-hidden">
            {about.storyImage ? (
              <img
                src={(about.storyImage as any).url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <img src="/logo.png" alt={siteSettings.shopName ?? ''} className="w-full max-w-xs object-contain" />
            )}
          </div>
        </div>
      </section>

      {/* Values */}
      {values.length > 0 && (
        <section className="bg-muted py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="takumi-eyebrow text-primary mb-8">{t('valuesHeading')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {values.map((v: any, i: number) => (
                <ValueItem key={i} icon={v.icon} title={v.title} description={v.description} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="takumi-eyebrow text-primary mb-8">{t('teamHeading')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {team.map((member: any, i: number) => (
              <TeamMemberCard key={i} name={member.name} role={member.role} years={member.years} specialty={member.specialty} photo={member.photo} />
            ))}
          </div>
        </section>
      )}

      {/* Facility */}
      {facility.length > 0 && (
        <section className="bg-muted py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="takumi-eyebrow text-primary mb-8">{t('facilityHeading')}</h2>
            <FacilityGallery items={facility} />
          </div>
        </section>
      )}

      {/* Company profile table */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="w-12 h-1 bg-primary mb-6" />
        <h2 className="takumi-display text-3xl mb-8">{t('profile')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <tbody>
              {profileRows.map((row) => (
                <tr key={row.label} className="border-b border-border">
                  <td className="py-4 pr-8 font-semibold w-1/3 align-top break-words">
                    {row.label}
                  </td>
                  <td className="py-4 text-muted-foreground break-words">
                    {row.link ? (
                      <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Map embed — omitted entirely when no address is configured */}
      {siteSettings.address && (
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="w-12 h-1 bg-primary mb-6" />
        <h2 className="takumi-display text-3xl mb-6">{t('findUs')}</h2>
        <div className="rounded-lg overflow-hidden border border-border aspect-video">
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(siteSettings.address)}&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin"
            title={t('mapTitle')}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
          {siteSettings.address}
        </p>
      </section>
      )}
    </div>
  )
}
