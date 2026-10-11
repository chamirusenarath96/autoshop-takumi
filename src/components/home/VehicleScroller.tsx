'use client'

import { Children } from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

type Props = {
  /** Accessible name for the scroller region. */
  label: string
  children: React.ReactNode
}

// Single horizontally-scrollable row of compact cards: swipe/drag on touch, arrows from md up.
export function VehicleScroller({ label, children }: Props) {
  const items = Children.toArray(children)

  return (
    <Carousel opts={{ align: 'start', dragFree: true }} aria-label={label}>
      <CarouselContent>
        {items.map((item, i) => (
          <CarouselItem key={i} className="basis-[68%] sm:basis-[40%] md:basis-[30%] lg:basis-1/4 xl:basis-1/5 [&>[data-slot=card]]:h-full">
            {item}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2 hidden md:flex" />
      <CarouselNext className="right-2 hidden md:flex" />
    </Carousel>
  )
}
