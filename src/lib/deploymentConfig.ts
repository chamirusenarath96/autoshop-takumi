/**
 * Pure functions resolving production infrastructure config from environment
 * variables. Kept separate from payload.config.ts so the decision logic is
 * unit-testable without booting Payload or touching a real database/bucket.
 */

export type DatabaseConfig =
  | { type: 'sqlite'; filePath: string }
  | { type: 'postgres'; connectionString: string }

/**
 * Local dev / CI: SQLite (zero config). Production: Postgres once DATABASE_URI
 * is set (Neon recommended — see README Production Deployment).
 */
export function resolveDatabaseConfig(
  env: Record<string, string | undefined>,
  sqliteFilePath: string,
): DatabaseConfig {
  const connectionString = env.DATABASE_URI
  if (connectionString) {
    return { type: 'postgres', connectionString }
  }
  return { type: 'sqlite', filePath: sqliteFilePath }
}

export type R2Config = {
  bucket: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl: string
}

/**
 * Returns null (R2 storage disabled, local /public/media used instead) unless
 * every required R2 variable is set — a partially-configured bucket is
 * treated the same as an unconfigured one rather than failing at runtime.
 */
export function resolveR2Config(env: Record<string, string | undefined>): R2Config | null {
  const { R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL } = env

  if (!R2_BUCKET || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
    return null
  }

  return {
    bucket: R2_BUCKET,
    endpoint: R2_ENDPOINT,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    publicUrl: R2_PUBLIC_URL,
  }
}
