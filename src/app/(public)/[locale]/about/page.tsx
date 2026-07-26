import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-settings'

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
  const storyParagraphs = t.raw('storyParagraphs') as string[]
  const services = [
    { icon: '🚗', label: t('services.sales') },
    { icon: '🔧', label: t('services.maintenance') },
    { icon: '📋', label: t('services.inspection') },
    { icon: '✈️', label: t('services.export') },
  ]
  const profileRows: { label: string; value: string | null; link?: string | null }[] = [
    { label: t('fields.companyName'), value: siteSettings.shopName, link: null },
    { label: t('fields.address'), value: siteSettings.address, link: null },
    { label: t('fields.phone'), value: siteSettings.contactPhone, link: null },
    { label: t('fields.email'), value: siteSettings.contactEmail, link: null },
    { label: t('fields.hours'), value: t('hoursValue'), link: null },
    {
      label: t('fields.instagram'),
      value: siteSettings.instagramHandle,
      link: siteSettings.instagramUrl,
    },
  ].filter((row) => row.value)

  return (
    <div>
      {/* Hero */}
      <section className="bg-[hsl(var(--secondary))] text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      {/* About story */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-12 h-1 bg-[hsl(var(--primary))] mb-6" />
            <h2 className="text-3xl font-bold mb-6">{t('story')}</h2>
            <div className="space-y-4 text-[hsl(var(--muted-foreground))] leading-relaxed">
              {storyParagraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {siteSettings.instagramUrl && (
              <a
                href={siteSettings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 bg-[hsl(var(--primary))] text-white px-6 py-3 rounded font-semibold hover:opacity-90 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                {siteSettings.instagramHandle}
              </a>
            )}
          </div>

          {/* Logo / visual */}
          <div className="flex items-center justify-center bg-[hsl(var(--muted))] rounded-lg p-12">
            <img src="/logo.png" alt={siteSettings.shopName || 'Autoshop Takumi'} className="w-full max-w-xs object-contain" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-[hsl(var(--muted))] py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="w-12 h-1 bg-[hsl(var(--primary))] mb-6" />
          <h2 className="text-3xl font-bold mb-10">{t('servicesHeading')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <div key={s.label} className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="text-4xl mb-3">{s.icon}</div>
                <p className="font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company profile table */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="w-12 h-1 bg-[hsl(var(--primary))] mb-6" />
        <h2 className="text-3xl font-bold mb-8">{t('profile')}</h2>
        <table className="w-full text-sm border-collapse">
          <tbody>
            {profileRows.map((row) => (
              <tr key={row.label} className="border-b border-[hsl(var(--border))]">
                <td className="py-4 pr-8 font-semibold text-[hsl(var(--secondary))] w-1/3 align-top">
                  {row.label}
                </td>
                <td className="py-4 text-[hsl(var(--muted-foreground))]">
                  {row.link ? (
                    <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] hover:underline">
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
      </section>

      {/* Map embed */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="w-12 h-1 bg-[hsl(var(--primary))] mb-6" />
        <h2 className="text-3xl font-bold mb-6">{t('findUs')}</h2>
        <div className="rounded-lg overflow-hidden border border-[hsl(var(--border))] aspect-video">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3093.8!2d140.9399!3d38.2752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f8a282a4c4b1f0f%3A0x0!2z5a6u5Yy65a6u5Yy65a6u5Yy6!5e0!3m2!1sja!2sjp!4v1"
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
        {siteSettings.address && (
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-line">
            {siteSettings.address}
          </p>
        )}
      </section>
    </div>
  )
}
