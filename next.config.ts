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
  // TEMPORARY: @payloadcms/drizzle loads drizzle-kit/api via a synthetic
  // createRequire(import.meta.url) call, which Next's file tracer can't
  // follow through ESM/CJS interop even though it's a literal string.
  // Remove this alongside src/app/api/internal-init-schema/ once the
  // one-time production schema push is confirmed working.
  outputFileTracingIncludes: {
    '/api/internal-init-schema': ['./node_modules/drizzle-kit/**/*'],
  },
}

export default withNextIntl(withPayload(nextConfig))
