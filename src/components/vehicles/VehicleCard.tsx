import { formatPrice } from '@/lib/utils'

type Props = {
  vehicle: any
  locale: string
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-gray-200 text-gray-600',
}

const statusLabels: Record<string, Record<string, string>> = {
  ja: { available: '在庫あり', reserved: '商談中', sold: '売約済' },
  en: { available: 'Available', reserved: 'Reserved', sold: 'Sold' },
}

export function VehicleCard({ vehicle, locale }: Props) {
  const heroImage = typeof vehicle.heroImage === 'object' ? vehicle.heroImage : null
  const imgUrl = heroImage?.sizes?.card?.url ?? heroImage?.url ?? '/placeholder-car.jpg'

  const price = vehicle.priceOnRequest
    ? locale === 'ja' ? '要お問い合わせ' : 'Contact for price'
    : vehicle.price
      ? formatPrice(vehicle.price, vehicle.currency ?? 'JPY', locale === 'ja' ? 'ja-JP' : 'en-US')
      : ''

  const statusLabel = statusLabels[locale]?.[vehicle.status] ?? vehicle.status

  return (
    <a
      href={`/${locale}/vehicles/${vehicle.slug}`}
      className="group block rounded-lg border border-[hsl(var(--border))] overflow-hidden hover:shadow-md transition"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[hsl(var(--muted))]">
        <img
          src={imgUrl}
          alt={vehicle.title ?? ''}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        {vehicle.status !== 'available' && (
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded ${statusColors[vehicle.status] ?? ''}`}>
            {statusLabel}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base line-clamp-2">{vehicle.title}</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          {vehicle.year}{locale === 'ja' ? '年' : ''}{vehicle.mileageKm ? ` · ${vehicle.mileageKm.toLocaleString()} km` : ''}
        </p>
        <p className="mt-2 text-lg font-bold text-[hsl(var(--primary))]">{price}</p>
      </div>
    </a>
  )
}
