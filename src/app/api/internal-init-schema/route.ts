import { NextRequest, NextResponse } from 'next/server'
import { pushSchema } from 'drizzle-kit/api'
import { getPayload } from '@/lib/payload'

// TEMPORARY, ONE-TIME USE ONLY. Creates the Postgres schema from the current
// Payload config on a fresh database (postgresAdapter only auto-pushes
// outside NODE_ENV=production; this route forces it once for initial setup).
// Uses a static import of drizzle-kit/api (rather than Payload's own
// pushDevSchema, which loads it via a dynamic createRequire() call that
// Next's file tracer doesn't follow) so the module is reliably bundled.
// Delete this file immediately after confirming a successful response.
const ONE_TIME_NONCE = '88d298fd807bf5dbfad9a393a3e71306bdd70e89a9864db8'

export async function GET(req: NextRequest) {
  const nonce = req.nextUrl.searchParams.get('nonce')
  if (nonce !== ONE_TIME_NONCE) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const payload = await getPayload()
  const adapter = payload.db as unknown as {
    schema: Record<string, unknown>
    drizzle: Parameters<typeof pushSchema>[1]
    schemaName?: string
    tablesFilter?: string[]
  }

  const { apply, hasDataLoss, warnings } = await pushSchema(
    adapter.schema,
    adapter.drizzle,
    adapter.schemaName ? [adapter.schemaName] : undefined,
    adapter.tablesFilter,
  )

  await apply()

  return NextResponse.json({ status: 'schema pushed', hasDataLoss, warnings })
}
