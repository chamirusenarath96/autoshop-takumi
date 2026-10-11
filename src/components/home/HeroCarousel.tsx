'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

export type HeroSlide = { url: string; alt: string }

type Props = {
  slides: HeroSlide[]
  /** Headline panel, rendered over the photos (server-rendered by the page). */
  children: React.ReactNode
}

const AUTOPLAY_MS = 6000

// Full-bleed hero. Photos are 4:3 originals shown with object-cover in a fixed-height band:
// on phones the whole photo is visible (and pans sideways); from md up the band crops the
// top and bottom, anchored low (65%) because cars sit in the lower-middle of the frame.
export function HeroCarousel({ slides, children }: Props) {
  const t = useTranslations('hero.carousel')
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const autoplay = useRef(Autoplay({ delay: AUTOPLAY_MS, stopOnInteraction: false, stopOnMouseEnter: true }))

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on('select', () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  // Respect "reduce motion": no automatic sliding, manual controls still work.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) autoplay.current.stop()
  }, [])

  const hasMany = slides.length > 1
  const bandClass = 'h-[460px] md:h-[540px] lg:h-[680px]'

  return (
    <section className={cn('relative w-full overflow-hidden bg-hero-overlay', bandClass)} aria-label={t('label')}>
      {slides.length > 0 && (
        <Carousel
          opts={{ loop: hasMany, watchDrag: hasMany }}
          plugins={hasMany ? [autoplay.current] : []}
          setApi={setApi}
          className="absolute inset-0"
        >
          <CarouselContent className="ml-0">
            {slides.map((slide, i) => (
              <CarouselItem key={slide.url} className={cn('overflow-hidden pl-0', bandClass)}>
                <img
                  src={slide.url}
                  alt={slide.alt}
                  className="h-full w-full object-cover object-[50%_65%] max-md:w-[613px] max-md:max-w-none max-md:animate-[hero-pan_12s_ease-in-out_infinite_alternate] motion-reduce:max-md:translate-x-[calc((100vw-613px)/2)] motion-reduce:max-md:animate-none"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}

      {/* Light scrim: the headline sits on an opaque brand panel, so this only unifies the photos. */}
      {slides.length > 0 && <div className="pointer-events-none absolute inset-0 bg-hero-overlay/25 dark:bg-hero-overlay/40" />}

      <div className="pointer-events-none absolute inset-0 flex items-end md:items-center">
        <div className="pointer-events-auto w-full md:container md:mx-auto md:px-16">{children}</div>
      </div>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            aria-label={t('previous')}
            className="absolute top-1/2 left-3 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-hero-overlay transition hover:bg-white focus-visible:ring-[3px] focus-visible:ring-ring/50 md:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            aria-label={t('next')}
            className="absolute top-1/2 right-3 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-hero-overlay transition hover:bg-white focus-visible:ring-[3px] focus-visible:ring-ring/50 md:flex"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.url}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={t('goTo', { n: i + 1 })}
                aria-current={i === current}
                className={cn('h-1.5 rounded-full transition-all', i === current ? 'w-6 bg-brand' : 'w-1.5 bg-white/60')}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
