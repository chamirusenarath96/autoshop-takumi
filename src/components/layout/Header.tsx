'use client'

import { useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'
import { Link } from './Link'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { InstagramIcon } from './InstagramIcon'
import { ExternalLink } from 'lucide-react'
import { INSTAGRAM_URL, JAPAN_STORE_URL } from '@/lib/shop-links'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

type Props = { locale: string }

export function Header({ locale }: Props) {
  const t = useTranslations('nav')
  const tShop = useTranslations('shop')

  const navLinks = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/vehicles`, label: t('vehicles') },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="h-[3px] bg-brand" />
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        <Link href={`/${locale}`} className="text-lg font-semibold">
          {tShop('name')}
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {JAPAN_STORE_URL && (
            <Button variant="outline" size="sm" asChild>
              <a href={JAPAN_STORE_URL} target="_blank" rel="noopener noreferrer">
                {t('japanStore')}
                <ExternalLink />
              </a>
            </Button>
          )}
          <Button variant="outline" size="icon-sm" asChild>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={t('instagram')}>
              <InstagramIcon />
            </a>
          </Button>
          <LocaleSwitcher locale={locale} />
          <ThemeToggle />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto md:hidden" aria-label={t('menu')}>
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" data-testid="mobile-nav-panel">
            <SheetHeader>
              <SheetTitle>{t('menu')}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {navLinks.map((link) => (
                <Button key={link.href} variant="ghost" className="justify-start" asChild>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
              {JAPAN_STORE_URL && (
                <Button variant="ghost" className="justify-start" asChild>
                  <a href={JAPAN_STORE_URL} target="_blank" rel="noopener noreferrer">
                    {t('japanStore')}
                    <ExternalLink />
                  </a>
                </Button>
              )}
              <Button variant="ghost" className="justify-start" asChild>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <InstagramIcon />
                  {t('instagram')}
                </a>
              </Button>
            </nav>
            <Separator />
            <div className="flex items-center gap-2 px-4">
              <LocaleSwitcher locale={locale} />
              <ThemeToggle />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
