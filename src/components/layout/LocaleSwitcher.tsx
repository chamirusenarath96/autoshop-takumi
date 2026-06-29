'use client'

import { usePathname, useRouter } from 'next/navigation'

type Props = { locale: string; dark?: boolean }

export function LocaleSwitcher({ locale, dark }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(next: string) {
    const newPath = pathname.replace(/^\/(ja|en)/, `/${next}`)
    router.push(newPath)
  }

  const base = dark
    ? 'flex items-center gap-0.5 text-xs border border-white/30 rounded overflow-hidden'
    : 'flex items-center gap-1 text-sm border border-[hsl(var(--border))] rounded overflow-hidden'

  const activeClass = dark
    ? 'px-2 py-0.5 bg-white text-[hsl(var(--secondary))] font-semibold'
    : 'px-2 py-1 bg-[hsl(var(--secondary))] text-white'

  const inactiveClass = dark
    ? 'px-2 py-0.5 text-white/70 hover:text-white transition'
    : 'px-2 py-1 hover:bg-[hsl(var(--muted))] transition'

  return (
    <div className={base}>
      <button onClick={() => switchLocale('ja')} className={locale === 'ja' ? activeClass : inactiveClass}>
        JA
      </button>
      <button onClick={() => switchLocale('en')} className={locale === 'en' ? activeClass : inactiveClass}>
        EN
      </button>
    </div>
  )
}
