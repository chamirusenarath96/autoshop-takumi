'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type Props = { locale: string }

// Language names are shown as their own endonym regardless of the active UI locale
// (same convention as "Deutsch" or "日本語" switchers elsewhere), so these are
// intentionally not routed through next-intl.
const LOCALES = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
] as const

export function LocaleSwitcher({ locale }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(next: string) {
    // Radix reports '' when the active item is clicked again — a language must stay selected.
    if (!next || next === locale) return
    const newPath = pathname.replace(/^\/(ja|en)/, `/${next}`)
    router.push(newPath)
  }

  return (
    <ToggleGroup type="single" variant="outline" size="sm" value={locale} onValueChange={switchLocale}>
      {LOCALES.map(({ code, label }) => (
        <ToggleGroupItem key={code} value={code} lang={code}>
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
