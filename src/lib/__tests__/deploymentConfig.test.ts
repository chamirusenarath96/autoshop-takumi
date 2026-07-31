import { describe, it, expect } from 'vitest'
import { resolveDatabaseConfig, resolveR2Config } from '../deploymentConfig'

describe('resolveDatabaseConfig', () => {
  it('falls back to sqlite when DATABASE_URI is unset', () => {
    expect(resolveDatabaseConfig({}, '/tmp/database.db')).toEqual({
      type: 'sqlite',
      filePath: '/tmp/database.db',
    })
  })

  it('uses postgres when DATABASE_URI is set', () => {
    const uri = 'postgres://user:pass@host/db?sslmode=require'
    expect(resolveDatabaseConfig({ DATABASE_URI: uri }, '/tmp/database.db')).toEqual({
      type: 'postgres',
      connectionString: uri,
    })
  })
})

describe('resolveR2Config', () => {
  const fullEnv = {
    R2_BUCKET: 'autoshop-media',
    R2_ENDPOINT: 'https://abc123.r2.cloudflarestorage.com',
    R2_ACCESS_KEY_ID: 'key-id',
    R2_SECRET_ACCESS_KEY: 'secret',
    R2_PUBLIC_URL: 'https://media.autoshoptakumi.example',
  }

  it('returns null when no R2 vars are set', () => {
    expect(resolveR2Config({})).toBeNull()
  })

  it.each(Object.keys(fullEnv))('returns null when %s is missing', (missingKey) => {
    const env = { ...fullEnv, [missingKey]: undefined }
    expect(resolveR2Config(env)).toBeNull()
  })

  it('returns the full config when every R2 var is set', () => {
    expect(resolveR2Config(fullEnv)).toEqual({
      bucket: fullEnv.R2_BUCKET,
      endpoint: fullEnv.R2_ENDPOINT,
      accessKeyId: fullEnv.R2_ACCESS_KEY_ID,
      secretAccessKey: fullEnv.R2_SECRET_ACCESS_KEY,
      publicUrl: fullEnv.R2_PUBLIC_URL,
    })
  })
})
