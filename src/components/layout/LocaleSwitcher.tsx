'use client'

import { usePathname, useRouter } from 'next/navigation'

type Props = { locale: string; dark?: boolean }

export function LocaleSwitcher({ locale }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(next: string) {
    const newPath = pathname.replace(/^\/(ja|en)/, `/${next}`)
    router.push(newPath)
  }

  return (
    <div className="flex items-center text-sm font-medium border border-[hsl(var(--border))] rounded overflow-hidden">
      {(['ja', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2.5 py-1 transition ${
            locale === l
              ? 'bg-[hsl(var(--secondary))] text-white'
              : 'text-[hsl(var(--nav-fg))] hover:bg-[hsl(var(--muted))]'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
