import config from '@payload-config'
import { getPayload as getPayloadInstance } from 'payload'

let cached: Awaited<ReturnType<typeof getPayloadInstance>> | null = null

export async function getPayload() {
  if (cached) return cached
  cached = await getPayloadInstance({ config })
  return cached
}
