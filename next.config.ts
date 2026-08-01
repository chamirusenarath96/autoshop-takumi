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
  // webpack bundling doesn't package correctly for the serverless function --
  // the static import IS traced (confirmed via runtime logs), but the files
  // still don't land in the deployed bundle. Marking it external tells Next
  // to leave it as a plain node_modules require instead of bundling it.
  // Remove alongside src/app/api/internal-init-schema/ once done.
  serverExternalPackages: ['drizzle-kit'],
}

export default withNextIntl(withPayload(nextConfig))
