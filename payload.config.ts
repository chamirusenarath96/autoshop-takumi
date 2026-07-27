import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// SQLite needs its parent directory to exist before it can create the db file.
// .payload/ is gitignored (local dev artifact), so CI runners need it created on first boot.
const payloadDataDir = path.resolve(dirname, '.payload')
if (!fs.existsSync(payloadDataDir)) {
  fs.mkdirSync(payloadDataDir, { recursive: true })
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
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

  // Local dev: SQLite (zero config). Production: swap for postgresAdapter by setting DATABASE_URI.
  db: sqliteAdapter({
    client: {
      url: `file:${path.resolve(dirname, '.payload', 'database.db')}`,
    },
  }),

  typescript: {
    outputFile: path.resolve(dirname, 'src', 'payload-types.ts'),
  },

  secret: process.env.PAYLOAD_SECRET ?? 'dev-secret',

  sharp,
})
