type Item = { image?: any; caption?: string | null }

export function FacilityGallery({ items }: { items: Item[] }) {
  const withImages = (items ?? []).filter(
    (item) => typeof item.image === 'object' && (item.image?.sizes?.card?.url || item.image?.url),
  )
  if (!withImages.length) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {withImages.map((item, i) => {
        const imageUrl = item.image?.sizes?.card?.url ?? item.image?.url
        return (
          <figure key={i} className="rounded-lg overflow-hidden bg-muted">
            <div className="aspect-[4/3]">
              <img src={imageUrl} alt={item.caption ?? ''} className="w-full h-full object-cover" />
            </div>
            {item.caption && (
              <figcaption className="text-xs text-muted-foreground px-2 py-1.5">{item.caption}</figcaption>
            )}
          </figure>
        )
      })}
    </div>
  )
}
