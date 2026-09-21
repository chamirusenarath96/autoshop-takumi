import { formatVehiclePriceDisplay } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { resolveLocalizedField, type VehicleLocale } from '@/lib/content-locale'

type Props = {
  vehicle: any
  locale: string
  priceOnRequestLabel?: string
}

const defaultPriceOnRequestLabel: Record<string, string> = {
  ja: '要お問い合わせ',
  en: 'Contact for price',
}

const statusVariants: Record<string, BadgeProps['variant']> = {
  available: 'success',
  reserved: 'warning',
  sold: 'secondary',
}

const statusLabels: Record<string, Record<string, string>> = {
  ja: { available: '在庫あり', reserved: '商談中', sold: '売約済' },
  en: { available: 'Available', reserved: 'Reserved', sold: 'Sold' },
}

export function VehicleCard({ vehicle, locale, priceOnRequestLabel }: Props) {
  const heroImage = typeof vehicle.heroImage === 'object' ? vehicle.heroImage : null
  const imgUrl = heroImage?.sizes?.card?.url ?? heroImage?.url ?? '/placeholder-car.svg'
  const activeLocale = locale as VehicleLocale

  const title = resolveLocalizedField(vehicle.titleJa, vehicle.titleEn, activeLocale)

  const price = formatVehiclePriceDisplay(
    vehicle.priceJpy,
    vehicle.priceUsd,
    vehicle.priceOnRequest,
    locale === 'ja' ? 'ja-JP' : 'en-US',
    priceOnRequestLabel ?? defaultPriceOnRequestLabel[locale] ?? defaultPriceOnRequestLabel.en,
  )

  const statusLabel = statusLabels[locale]?.[vehicle.status] ?? vehicle.status

  return (
    <a href={`/${locale}/vehicles/${vehicle.slug}`} className="group block">
      <Card className="overflow-hidden py-0 gap-0 transition hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={imgUrl}
            alt={title ?? ''}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          {vehicle.status !== 'available' && (
            <Badge variant={statusVariants[vehicle.status]} className="absolute top-2 right-2">
              {statusLabel}
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-base line-clamp-2">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicle.year}{locale === 'ja' ? '年' : ''}{vehicle.mileageKm ? ` · ${vehicle.mileageKm.toLocaleString()} km` : ''}
          </p>
          <p className="mt-2 text-lg font-bold text-primary">{price}</p>
        </div>
      </Card>
    </a>
  )
}
