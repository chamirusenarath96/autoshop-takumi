'use client'

import { usePathname, useRouter } from 'next/navigation'

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
    <div className="flex items-center text-sm font-medium rounded-full overflow-hidden border" style={{ borderColor: 'var(--nav-border)' }}>
      {(['ja', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className="px-2.5 py-1 transition"
          style={
            locale === l
              ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
              : { color: 'var(--nav-fg)' }
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
