import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Inlined to avoid importing Node.js-specific modules into Edge runtime
const AUTH_COOKIE_NAME = 'auth_session'

// /api/cron/* is protected by CRON_SECRET header inside the handlers, not by JWT cookie
const PUBLIC_PATHS = ['/auth', '/api/auth/verify', '/api/auth/logout', '/api/cron']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
}

function getSecret(): Uint8Array {
  const secret = process.env.COOKIE_SECRET
  if (!secret) throw new Error('COOKIE_SECRET not configured')
  return new TextEncoder().encode(secret)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  try {
    await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/auth', request.url))
    response.cookies.delete(AUTH_COOKIE_NAME)
    return response
  }
}

export const runtime = 'edge'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
