'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  vehicleId: string
  locale: string
}

export function InquiryForm({ vehicleId, locale }: Props) {
  const t = useTranslations('inquiry')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const form = e.currentTarget
    const data = {
      vehicle: vehicleId,
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      locale,
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('success')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return <p className="text-green-700 font-medium">{t('success')}</p>
  }

  const inputClass =
    'w-full min-h-11 border border-[hsl(var(--border))] rounded px-3 py-2 text-base sm:text-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="inquiry-name" className="block text-sm font-medium mb-1">{t('name')}</label>
        <input id="inquiry-name" name="name" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="inquiry-email" className="block text-sm font-medium mb-1">{t('email')}</label>
        <input id="inquiry-email" name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="inquiry-phone" className="block text-sm font-medium mb-1">{t('phone')}</label>
        <input id="inquiry-phone" name="phone" type="tel" className={inputClass} />
      </div>
      <div>
        <label htmlFor="inquiry-message" className="block text-sm font-medium mb-1">{t('message')}</label>
        <textarea
          id="inquiry-message"
          name="message"
          required
          rows={4}
          className="w-full min-h-32 border border-[hsl(var(--border))] rounded px-3 py-2 text-base sm:text-sm"
        />
      </div>
      {status === 'error' && <p className="text-red-600 text-sm break-words">{t('error')}</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="min-h-11 min-w-11 bg-[hsl(var(--primary))] text-white px-6 py-2 rounded font-semibold hover:opacity-90 transition disabled:opacity-50"
      >
        {status === 'loading' ? '...' : t('submit')}
      </button>
    </form>
  )
}
