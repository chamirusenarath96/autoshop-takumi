'use client'

import { useRef, useState } from 'react'

type Props = {
  heroImage: any
  gallery: { image: any; caption?: string }[]
}

const SWIPE_THRESHOLD_PX = 40

export function VehicleGallery({ heroImage, gallery }: Props) {
  const allImages = [
    { image: heroImage, caption: '' },
    ...gallery,
  ].filter((g) => g.image)

  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const current = allImages[active]
  const currentUrl =
    (typeof current?.image === 'object' ? current.image?.sizes?.detail?.url ?? current.image?.url : null) ?? ''

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current
    touchStartX.current = null
    if (startX === null || allImages.length < 2) return
    const endX = e.changedTouches[0]?.clientX ?? startX
    const delta = endX - startX
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return
    setActive((i) => {
      const next = delta < 0 ? i + 1 : i - 1
      return Math.max(0, Math.min(allImages.length - 1, next))
    })
  }

  return (
    <div>
      {/* Main image */}
      <div
        data-testid="gallery-main"
        data-active-index={active}
        className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted cursor-pointer"
        onClick={() => setLightbox(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
                className={`shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition ${i === active ? 'border-primary' : 'border-transparent'}`}
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
