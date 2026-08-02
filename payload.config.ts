import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import { Users } from './src/collections/Users'
import { Makes } from './src/collections/Makes'
import { Models } from './src/collections/Models'
import { Media } from './src/collections/Media'
import { Vehicles } from './src/collections/Vehicles'
import { Inquiries } from './src/collections/Inquiries'
import { SiteSettings } from './src/globals/SiteSettings'
import { Homepage } from './src/globals/Homepage'
import { resolveDatabaseConfig, resolveR2Config } from './src/lib/deploymentConfig'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseConfig = resolveDatabaseConfig(
  process.env,
  path.resolve(dirname, '.payload', 'database.db'),
)

// SQLite needs its parent directory to exist before it can create the db file.
// .payload/ is gitignored (local dev artifact), so CI runners need it created on
// first boot. Skipped entirely on Postgres: Vercel's deployed filesystem is
// read-only outside /tmp, so an unconditional mkdir would throw in production.
if (databaseConfig.type === 'sqlite') {
  const payloadDataDir = path.dirname(databaseConfig.filePath)
  if (!fs.existsSync(payloadDataDir)) {
    fs.mkdirSync(payloadDataDir, { recursive: true })
  }
}

const db =
  databaseConfig.type === 'postgres'
    ? postgresAdapter({ pool: { connectionString: databaseConfig.connectionString } })
    : sqliteAdapter({ client: { url: `file:${databaseConfig.filePath}` } })

const r2Config = resolveR2Config(process.env)

// R2 storage is opt-in: unset R2_* vars (local dev, or a fresh prod deploy
// before the bucket is created) fall back to local /public/media untouched.
const plugins = r2Config
  ? [
      s3Storage({
        collections: {
          media: {
            disableLocalStorage: true,
            generateFileURL: ({ filename }) => `${r2Config.publicUrl}/${filename}`,
          },
        },
        bucket: r2Config.bucket,
        config: {
          region: 'auto',
          endpoint: r2Config.endpoint,
          forcePathStyle: true,
          credentials: {
            accessKeyId: r2Config.accessKeyId,
            secretAccessKey: r2Config.secretAccessKey,
          },
        },
      }),
    ]
  : []

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
      // Without this, Payload's default resolution writes to
      // src/app/(payload)/admin/importMap.js, which nothing in this project
      // imports (layout.tsx, page.tsx, not-found.tsx, and actions.ts all
      // import from src/app/(payload)/importMap.ts). Pin it explicitly so a
      // future `generate:importmap` run can't silently regenerate the wrong,
      // unused file again.
      importMapFile: path.resolve(dirname, 'src/app/(payload)/importMap.ts'),
    },
  },

  collections: [Users, Makes, Models, Media, Vehicles, Inquiries],
  globals: [SiteSettings, Homepage],

  editor: lexicalEditor(),

  localization: {
    locales: [
      { label: 'Japanese', code: 'ja' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'ja',
    fallback: true,
  },

  db,

  plugins,

  typescript: {
    outputFile: path.resolve(dirname, 'src', 'payload-types.ts'),
  },

  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret',

  sharp,
})
