'use client'

import { useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'
import { Link } from './Link'
import { LocaleSwitcher } from './LocaleSwitcher'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import type { SiteSettingsData } from '@/lib/site-settings'

type Props = { locale: string; siteSettings: SiteSettingsData }

export function Header({ locale, siteSettings }: Props) {
  const t = useTranslations('nav')

  const navLinks = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/vehicles`, label: t('vehicles') },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        <Link href={`/${locale}`} className="text-lg font-semibold">
          {siteSettings.shopName || 'Autoshop Takumi'}
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto hidden md:block">
          <LocaleSwitcher locale={locale} />
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
            </nav>
            <Separator />
            <div className="px-4">
              <LocaleSwitcher locale={locale} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
