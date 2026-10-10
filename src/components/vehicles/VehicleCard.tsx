import { formatVehiclePriceDisplay } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

const statusVariants: Record<string, 'secondary' | 'destructive'> = {
  reserved: 'secondary',
  sold: 'destructive',
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
    <Card className="overflow-hidden pt-0">
      <div className="relative aspect-[4/3] bg-muted">
        <img src={imgUrl} alt={title ?? ''} className="h-full w-full object-cover" />
        {vehicle.status !== 'available' && (
          <Badge variant={statusVariants[vehicle.status] ?? 'secondary'} className="absolute top-3 right-3">
            {statusLabel}
          </Badge>
        )}
      </div>
      <CardHeader>
        <CardTitle role="heading" aria-level={3} className="line-clamp-2 leading-snug">
          {title}
        </CardTitle>
        <CardDescription>
          {vehicle.year}
          {locale === 'ja' ? '年' : ''}
          {vehicle.mileageKm ? ` · ${vehicle.mileageKm.toLocaleString()} km` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold text-primary">{price}</p>
      </CardContent>
    </Card>
  )
}
