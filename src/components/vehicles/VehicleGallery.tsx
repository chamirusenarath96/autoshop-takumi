'use client'

import { useState } from 'react'

type Props = {
  heroImage: any
  gallery: { image: any; caption?: string }[]
}

export function VehicleGallery({ heroImage, gallery }: Props) {
  const allImages = [
    { image: heroImage, caption: '' },
    ...gallery,
  ].filter((g) => g.image)

  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const current = allImages[active]
  const currentUrl =
    (typeof current?.image === 'object' ? current.image?.sizes?.detail?.url ?? current.image?.url : null) ?? ''

  return (
    <div>
      {/* Main image */}
      <div
        className="relative aspect-[16/9] rounded-lg overflow-hidden bg-[hsl(var(--muted))] cursor-pointer"
        onClick={() => setLightbox(true)}
      >
        <img src={currentUrl} alt={current?.caption ?? ''} className="w-full h-full object-cover" />
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {allImages.map((g, i) => {
            const thumbUrl =
              (typeof g.image === 'object' ? g.image?.sizes?.thumbnail?.url ?? g.image?.url : null) ?? ''
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition ${i === active ? 'border-[hsl(var(--primary))]' : 'border-transparent'}`}
              >
                <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
              </button>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={(typeof current?.image === 'object' ? current.image?.url : null) ?? ''}
            alt={current?.caption ?? ''}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none"
            onClick={() => setLightbox(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
