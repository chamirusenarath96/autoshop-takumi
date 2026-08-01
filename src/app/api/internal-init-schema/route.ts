import { NextRequest, NextResponse } from 'next/server'
import { pushDevSchema } from '@payloadcms/drizzle'
import { getPayload } from '@/lib/payload'

// TEMPORARY, ONE-TIME USE ONLY. Creates the Postgres schema from the current
// Payload config on a fresh database (postgresAdapter only auto-pushes
// outside NODE_ENV=production; this route forces it once for initial setup).
// Delete this file immediately after confirming a successful response.
const ONE_TIME_NONCE = '88d298fd807bf5dbfad9a393a3e71306bdd70e89a9864db8'

export async function GET(req: NextRequest) {
  const nonce = req.nextUrl.searchParams.get('nonce')
  if (nonce !== ONE_TIME_NONCE) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const payload = await getPayload()
  await pushDevSchema(payload.db as Parameters<typeof pushDevSchema>[0])

  return NextResponse.json({ status: 'schema pushed' })
}
