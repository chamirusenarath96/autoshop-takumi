import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getGalleryPhotos } from '@/lib/gallery'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'

type Props = {
  params: Promise<{ locale: string }>
}

// Photos come from the Gallery global; the page re-renders at most once a minute.
export const revalidate = 60

export default async function GalleryPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'gallery' })
  const photos = await getGalleryPhotos(locale as 'ja' | 'en')

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <GalleryGrid photos={photos} />
    </div>
  )
}
