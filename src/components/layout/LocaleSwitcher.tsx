'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Props = { locale: string }

// Language names are shown as their own endonym/abbreviation regardless of the
// active UI locale (same convention as "Deutsch" or "日本語" switchers elsewhere),
// so these are intentionally not routed through next-intl.
export function LocaleSwitcher({ locale }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(next: string) {
    const newPath = pathname.replace(/^\/(ja|en)/, `/${next}`)
    router.push(newPath)
  }

  return (
    <div className="flex items-center gap-1">
      {(['ja', 'en'] as const).map((l) => (
        <Button
          key={l}
          size="sm"
          variant={locale === l ? 'default' : 'ghost'}
          aria-pressed={locale === l}
          onClick={() => switchLocale(l)}
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
