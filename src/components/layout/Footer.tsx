'use client'

import { useTranslations } from 'next-intl'

const INSTAGRAM_URL = 'https://www.instagram.com/autoshop_takumi/'

export function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')

  return (
    <footer className="bg-[hsl(var(--secondary))] text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <img src="/logo.jpg" alt="Autoshop Takumi" className="h-8 w-auto object-contain mb-4" />
          <p className="text-white/60 text-sm leading-relaxed">
            Driven by Precision.<br />
            Powered by Trust.<br />
            Delivered by Takumi.
          </p>
        </div>

        {/* Links */}
        <div>
          <p className="font-semibold mb-3 text-white/80 uppercase text-xs tracking-widest">Navigation</p>
          <nav className="space-y-2">
            {[
              { href: '/en', label: tNav('home') },
              { href: '/en/vehicles', label: tNav('vehicles') },
              { href: '/en/about', label: tNav('about') },
            ].map((l) => (
              <a key={l.href} href={l.href} className="block text-sm text-white/60 hover:text-[hsl(var(--primary))] transition">
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Contact + Instagram */}
        <div>
          <p className="font-semibold mb-3 text-white/80 uppercase text-xs tracking-widest">Contact</p>
          <div className="space-y-2 text-sm text-white/60">
            <p>022-342-2285</p>
            <p>takumitradings@gmail.com</p>
            <p className="leading-relaxed">
              〒983-0013<br />
              宮城県仙台市宮城野区<br />
              中野字神明148-1
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-white/80 hover:text-[hsl(var(--primary))] transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
              @autoshop_takumi
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <p className="text-center text-xs text-white/40">
          © {new Date().getFullYear()} Autoshop Takumi. {t('rights')}
        </p>
      </div>
    </footer>
  )
}
