import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Regression test for a production incident: the admin panel (`/admin`) rendered
// as a totally blank page because the S3 storage plugin (active whenever R2_*
// env vars are set, see src/lib/deploymentConfig.ts) needs its upload-handler
// client component registered in the import map that Payload's admin UI resolves
// components through. Two things caused it:
//   1. A stray, always-empty `importMap.js` sat next to the real `importMap.ts`
//      and silently won module resolution for `import { importMap } from './importMap'`,
//      so any regeneration of the real file had no effect at runtime.
//   2. A previous fix ran the import-map generator but it wrote its output to
//      `admin/importMap.js` instead of the file actually imported by
//      layout.tsx/page.tsx/actions.ts, so that fix never took effect either.
const payloadDir = path.resolve(__dirname, '..')

describe('Payload admin import map', () => {
  it('has exactly one importMap file, at the path actually imported', () => {
    const entries = fs.readdirSync(payloadDir)
    const importMapFiles = entries.filter((name) => /^importMap\.(ts|js)$/.test(name))
    expect(importMapFiles).toEqual(['importMap.ts'])
  })

  it('does not have a stray importMap.js under admin/', () => {
    const adminImportMapPath = path.join(payloadDir, 'admin', 'importMap.js')
    expect(fs.existsSync(adminImportMapPath)).toBe(false)
  })

  it('registers the S3 upload handler client component used when R2 storage is enabled', () => {
    const source = fs.readFileSync(path.join(payloadDir, 'importMap.ts'), 'utf-8')
    expect(source).toContain('@payloadcms/storage-s3/client#S3ClientUploadHandler')
  })
})
