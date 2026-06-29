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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('name')}</label>
        <input name="name" required className="w-full border border-[hsl(var(--border))] rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('email')}</label>
        <input name="email" type="email" required className="w-full border border-[hsl(var(--border))] rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('phone')}</label>
        <input name="phone" type="tel" className="w-full border border-[hsl(var(--border))] rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('message')}</label>
        <textarea name="message" required rows={4} className="w-full border border-[hsl(var(--border))] rounded px-3 py-2 text-sm" />
      </div>
      {status === 'error' && <p className="text-red-600 text-sm">{t('error')}</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-[hsl(var(--primary))] text-white px-6 py-2 rounded font-semibold hover:opacity-90 transition disabled:opacity-50"
      >
        {status === 'loading' ? '...' : t('submit')}
      </button>
    </form>
  )
}
