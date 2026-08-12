import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from '@/lib/payload'
import { VehicleGallery } from '@/components/vehicles/VehicleGallery'
import { InquiryForm } from '@/components/vehicles/InquiryForm'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { formatVehiclePrices } from '@/lib/utils'
import { resolveLocalizedField, resolveLocalizedRichText, type VehicleLocale } from '@/lib/vehicle-locale'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

async function findVehicleBySlug(locale: string, slug: string) {
  const payload = await getPayload()
  const result = await payload.find({
    collection: 'vehicles',
    where: { slug: { equals: slug } },
    limit: 1,
    locale: locale as 'ja' | 'en',
    depth: 2,
  })
  return result.docs[0] as any | undefined
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const vehicle = await findVehicleBySlug(locale, slug)
  if (!vehicle) return {}

  const activeLocale = locale as VehicleLocale
  const title =
    resolveLocalizedField(vehicle.seoTitleJa, vehicle.seoTitleEn, activeLocale) ??
    resolveLocalizedField(vehicle.titleJa, vehicle.titleEn, activeLocale) ??
    vehicle.title
  const description =
    resolveLocalizedField(vehicle.seoDescriptionJa, vehicle.seoDescriptionEn, activeLocale) ??
    resolveLocalizedField(vehicle.summaryJa, vehicle.summaryEn, activeLocale)

  return { title, description }
}

export default async function VehicleDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const t = await getTranslations('vehicle')
  const tInquiry = await getTranslations('inquiry')
  const payload = await getPayload()

  const vehicle = await findVehicleBySlug(locale, slug)
  if (!vehicle) notFound()

  const activeLocale = locale as VehicleLocale
  const title = resolveLocalizedField(vehicle.titleJa, vehicle.titleEn, activeLocale) ?? vehicle.title
  const summary = resolveLocalizedField(vehicle.summaryJa, vehicle.summaryEn, activeLocale)
  const description = resolveLocalizedRichText(vehicle.descriptionJa, vehicle.descriptionEn, activeLocale)
  const highlights = (vehicle.highlights ?? [])
    .map((h: any) => resolveLocalizedField(h.textJa, h.textEn, activeLocale))
    .filter((text: string | undefined): text is string => text !== undefined)
  const specs = (vehicle.specs ?? [])
    .map((s: any) => ({
      label: resolveLocalizedField(s.labelJa, s.labelEn, activeLocale),
      value: resolveLocalizedField(s.valueJa, s.valueEn, activeLocale),
    }))
    .filter((s: { label?: string; value?: string }) => s.label !== undefined || s.value !== undefined)

  const priceOnRequestLabel = locale === 'ja' ? '要お問い合わせ' : 'Contact for price'
  const priceParts = formatVehiclePrices(vehicle.priceJpy, vehicle.priceUsd, vehicle.priceOnRequest, locale === 'ja' ? 'ja-JP' : 'en-US')
  const price = vehicle.priceOnRequest ? priceOnRequestLabel : priceParts.join(' / ')

  // Related vehicles
  let related: any[] = []
  if (vehicle.relatedVehicles?.length) {
    related = vehicle.relatedVehicles
  } else {
    const rel = await payload.find({
      collection: 'vehicles',
      where: {
        make: { equals: typeof vehicle.make === 'object' ? vehicle.make.id : vehicle.make },
        id: { not_equals: vehicle.id },
        status: { in: ['available', 'reserved'] },
      },
      limit: 3,
      locale: locale as 'ja' | 'en',
    })
    related = rel.docs
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Gallery */}
      <VehicleGallery heroImage={vehicle.heroImage} gallery={vehicle.gallery ?? []} />

      {/* Header */}
      <div className="mt-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold break-words">{title}</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {vehicle.year}{locale === 'ja' ? '年' : ''} ·{' '}
            {vehicle.mileageKm?.toLocaleString()} km
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[hsl(var(--primary))]">{price}</p>
          <span className="inline-block mt-1 text-sm px-2 py-0.5 rounded bg-[hsl(var(--muted))]">
            {vehicle.status}
          </span>
        </div>
      </div>

      {/* Summary */}
      {summary && <p className="mt-6 text-lg">{summary}</p>}

      {/* Description */}
      {description && (
        <section className="mt-8 prose max-w-none">
          <RichText data={description} />
        </section>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">{t('highlights')}</h2>
          <ul className="list-disc list-inside space-y-1">
            {highlights.map((text: string, i: number) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Specs table */}
      {specs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">{t('specs')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {vehicle.shakenExpiry && (
                  <tr className="border-b border-[hsl(var(--border))]">
                    <td className="py-2 pr-4 font-medium w-1/3 break-words">{t('shakenExpiry')}</td>
                    <td className="py-2 break-words">{new Date(vehicle.shakenExpiry).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'long' })}</td>
                  </tr>
                )}
                {specs.map((spec: { label?: string; value?: string }, i: number) => (
                  <tr key={i} className="border-b border-[hsl(var(--border))]">
                    <td className="py-2 pr-4 font-medium w-1/3 break-words">{spec.label}</td>
                    <td className="py-2 break-words">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Inquiry form */}
      <section className="mt-12 bg-[hsl(var(--muted))] rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{tInquiry('title')}</h2>
        <InquiryForm vehicleId={vehicle.id} locale={locale} />
      </section>

      {/* Related vehicles */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">{t('related')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((v: any) => (
              <VehicleCard key={v.id} vehicle={v} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
