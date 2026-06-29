import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket URL (add when R2 is configured)
      // { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },
}

export default withNextIntl(withPayload(nextConfig))
