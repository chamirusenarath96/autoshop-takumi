'use client'

import { usePathname, useRouter } from 'next/navigation'

type Props = { locale: string }

export function LocaleSwitcher({ locale }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(next: string) {
    // Replace /ja/ or /en/ prefix in the path
    const newPath = pathname.replace(/^\/(ja|en)/, `/${next}`)
    router.push(newPath)
  }

  return (
    <div className="flex items-center gap-1 text-sm border border-[hsl(var(--border))] rounded overflow-hidden">
      <button
        onClick={() => switchLocale('ja')}
        className={`px-2 py-1 transition ${locale === 'ja' ? 'bg-[hsl(var(--secondary))] text-white' : 'hover:bg-[hsl(var(--muted))]'}`}
      >
        JA
      </button>
      <button
        onClick={() => switchLocale('en')}
        className={`px-2 py-1 transition ${locale === 'en' ? 'bg-[hsl(var(--secondary))] text-white' : 'hover:bg-[hsl(var(--muted))]'}`}
      >
        EN
      </button>
    </div>
  )
}
