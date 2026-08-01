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
  // TEMPORARY: drizzle-kit bundles esbuild/native pieces that Next's default
  // webpack bundling doesn't package correctly for the serverless function.
  // serverExternalPackages fixed the bundling behavior (confirmed via runtime
  // logs -- error changed from a webpack-internal require failure to a
  // genuine ERR_MODULE_NOT_FOUND), but @vercel/nft's file trace still isn't
  // copying drizzle-kit's files into the deployed function. Hedging across
  // the plausible outputFileTracingIncludes key formats since Next's docs
  // don't pin down the exact one for an App Router route handler; unmatched
  // keys are harmless no-ops. Remove all of this alongside
  // src/app/api/internal-init-schema/ once done.
  serverExternalPackages: ['drizzle-kit'],
  outputFileTracingIncludes: {
    '/api/internal-init-schema': ['./node_modules/drizzle-kit/**'],
    '/api/internal-init-schema/**': ['./node_modules/drizzle-kit/**'],
    'app/api/internal-init-schema/route': ['./node_modules/drizzle-kit/**'],
    'src/app/api/internal-init-schema/route': ['./node_modules/drizzle-kit/**'],
  },
}

export default withNextIntl(withPayload(nextConfig))
