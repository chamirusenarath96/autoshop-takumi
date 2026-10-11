'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { GalleryPhoto } from '@/lib/gallery'

type Props = { photos: GalleryPhoto[] }

// Masonry grid of photos (no captions) that opens a swipeable full-size lightbox.
export function GalleryGrid({ photos }: Props) {
  const t = useTranslations('gallery')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">{t('empty')}</p>
  }

  return (
    <>
      <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={t('open', { n: i + 1 })}
            className="mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg bg-muted transition hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <img src={photo.thumb} alt={photo.alt} loading={i < 4 ? 'eager' : 'lazy'} className="h-auto w-full" />
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-5xl border-0 bg-black/90 p-2 text-white sm:max-w-5xl" showCloseButton>
          <DialogTitle className="sr-only">{t('title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('subtitle')}</DialogDescription>
          {openIndex !== null && <Lightbox photos={photos} startIndex={openIndex} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Lightbox({ photos, startIndex }: { photos: GalleryPhoto[]; startIndex: number }) {
  const t = useTranslations('gallery')
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(startIndex)

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on('select', () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  return (
    <div className="relative">
      <Carousel opts={{ startIndex, loop: photos.length > 1 }} setApi={setApi}>
        <CarouselContent className="ml-0">
          {photos.map((photo) => (
            <CarouselItem key={photo.id} className="flex h-[75vh] items-center justify-center pl-0">
              <img src={photo.full} alt={photo.alt} className="max-h-full max-w-full object-contain" />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            aria-label={t('previous')}
            className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black hover:bg-white"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            aria-label={t('next')}
            className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black hover:bg-white"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
      <p className="mt-2 text-center text-sm text-white/80" aria-live="polite">
        {t('counter', { current: current + 1, total: photos.length })}
      </p>
    </div>
  )
}
