import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ja' ? '会社概要 | Autoshop Takumi' : 'About | Autoshop Takumi',
    description:
      locale === 'ja'
        ? '仙台市のオートショップ匠。車の販売・整備・車検・カスタムのご相談はお気軽に。'
        : 'Autoshop Takumi — Sendai-based auto shop specialising in vehicle sales, maintenance, inspections and custom work.',
  }
}

const INSTAGRAM_URL = 'https://www.instagram.com/autoshop_takumi/'

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('about')
  const isJa = locale === 'ja'

  return (
    <div>
      {/* Hero */}
      <section className="bg-[hsl(var(--secondary))] text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      {/* About story */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-12 h-1 bg-[hsl(var(--primary))] mb-6" />
            <h2 className="text-3xl font-bold mb-6">{t('story')}</h2>
            {isJa ? (
              <div className="space-y-4 text-[hsl(var(--muted-foreground))] leading-relaxed">
                <p>
                  オートショップ匠は、宮城県仙台市を拠点とする自動車販売・整備専門店です。
                  国産車から輸入車まで幅広い車種を取り扱い、一台一台の品質と状態に徹底的にこだわってお客様にお届けしています。
                </p>
                <p>
                  整備・車検・カスタムなど、クルマにまつわるあらゆるご相談に経験豊富なスタッフが対応いたします。
                  「精度に駆られ、信頼に支えられ」の理念のもと、お客様との長いお付き合いを大切にしています。
                </p>
                <p>
                  海外からのお客様にも対応しており、輸出手続きのサポートも承っております。
                  Instagramでは最新の在庫情報や整備の様子を日々発信しています。
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-[hsl(var(--muted-foreground))] leading-relaxed">
                <p>
                  Autoshop Takumi is a vehicle sales and servicing specialist based in Sendai, Miyagi Prefecture.
                  We handle a wide range of domestic and imported vehicles, with an unwavering focus on quality
                  and condition for every car we sell.
                </p>
                <p>
                  Our experienced team covers everything from maintenance and inspections to custom work —
                  driven by precision and powered by trust. We value long-term relationships with every customer
                  we serve.
                </p>
                <p>
                  We also support international buyers with export documentation. Follow us on Instagram
                  for the latest inventory arrivals and behind-the-scenes workshop content.
                </p>
              </div>
            )}

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-8 bg-[hsl(var(--primary))] text-white px-6 py-3 rounded font-semibold hover:opacity-90 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
              @autoshop_takumi
            </a>
          </div>

          {/* Logo / visual */}
          <div className="flex items-center justify-center bg-[hsl(var(--muted))] rounded-lg p-12">
            <img src="/logo.jpg" alt="Autoshop Takumi" className="w-full max-w-xs object-contain" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-[hsl(var(--muted))] py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="w-12 h-1 bg-[hsl(var(--primary))] mb-6" />
          <h2 className="text-3xl font-bold mb-10">{isJa ? 'サービス' : 'Our Services'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🚗', ja: '中古車販売', en: 'Vehicle Sales' },
              { icon: '🔧', ja: '整備・修理', en: 'Maintenance & Repair' },
              { icon: '📋', ja: '車検', en: 'Vehicle Inspection (Shaken)' },
              { icon: '✈️', ja: '輸出サポート', en: 'Export Support' },
            ].map((s) => (
              <div key={s.en} className="bg-white rounded-lg p-6 text-center shadow-sm">
                <div className="text-4xl mb-3">{s.icon}</div>
                <p className="font-semibold">{isJa ? s.ja : s.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company profile table */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="w-12 h-1 bg-[hsl(var(--primary))] mb-6" />
        <h2 className="text-3xl font-bold mb-8">{t('profile')}</h2>
        <table className="w-full text-sm border-collapse">
          <tbody>
            {[
              {
                label: { ja: '会社名', en: 'Company Name' },
                value: { ja: 'オートショップ匠', en: 'Autoshop Takumi' },
              },
              {
                label: { ja: '所在地', en: 'Address' },
                value: {
                  ja: '〒983-0013 宮城県仙台市宮城野区中野字神明148-1',
                  en: '148-1 Nakanonazamyojin, Miyaginoku, Sendai, Miyagi 983-0013, Japan',
                },
              },
              {
                label: { ja: '電話番号', en: 'Phone' },
                value: { ja: '022-342-2285', en: '022-342-2285' },
              },
              {
                label: { ja: 'メールアドレス', en: 'Email' },
                value: { ja: 'takumitradings@gmail.com', en: 'takumitradings@gmail.com' },
              },
              {
                label: { ja: '営業時間', en: 'Business Hours' },
                value: {
                  ja: 'お問い合わせください',
                  en: 'Please contact us for hours',
                },
              },
              {
                label: { ja: 'Instagram', en: 'Instagram' },
                value: { ja: '@autoshop_takumi', en: '@autoshop_takumi' },
                link: INSTAGRAM_URL,
              },
            ].map((row, i) => (
              <tr key={i} className="border-b border-[hsl(var(--border))]">
                <td className="py-4 pr-8 font-semibold text-[hsl(var(--secondary))] w-1/3 align-top">
                  {isJa ? row.label.ja : row.label.en}
                </td>
                <td className="py-4 text-[hsl(var(--muted-foreground))]">
                  {row.link ? (
                    <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] hover:underline">
                      {isJa ? row.value.ja : row.value.en}
                    </a>
                  ) : (
                    isJa ? row.value.ja : row.value.en
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Map embed */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="w-12 h-1 bg-[hsl(var(--primary))] mb-6" />
        <h2 className="text-3xl font-bold mb-6">{isJa ? 'アクセス' : 'Find Us'}</h2>
        <div className="rounded-lg overflow-hidden border border-[hsl(var(--border))] aspect-video">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3093.8!2d140.9399!3d38.2752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5f8a282a4c4b1f0f%3A0x0!2z5a6u5Yy65a6u5Yy65a6u5Yy6!5e0!3m2!1sja!2sjp!4v1"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={isJa ? '店舗地図' : 'Store location map'}
          />
        </div>
        <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
          {isJa
            ? '〒983-0013 宮城県仙台市宮城野区中野字神明148-1'
            : '148-1 Nakanonazamyojin, Miyaginoku, Sendai, Miyagi 983-0013'}
        </p>
      </section>
    </div>
  )
}
