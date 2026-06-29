import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'

const handleI18nRouting = createMiddleware(routing)

export default function middleware(req: NextRequest) {
  // Skip Payload admin and API routes
  if (
    req.nextUrl.pathname.startsWith('/admin') ||
    req.nextUrl.pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  return handleI18nRouting(req)
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
