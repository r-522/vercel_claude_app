import { NextRequest, NextResponse } from 'next/server'
import { signAuthCookie, buildCookieHeader } from '@/lib/auth/cookies'
import { checkRateLimit } from '@/lib/auth/rate-limiter'

// Generic error message — same for all failure types to prevent enumeration
const GENERIC_ERROR = 'コードが正しくありません'

export async function POST(request: NextRequest) {
  // Resolve client IP — use X-Forwarded-For on Vercel
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

  // Rate limit check BEFORE code comparison to prevent timing attacks
  const { allowed } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 429 })
  }

  let body: { code?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
  }

  const { code } = body

  // ACCESS_CODE is read ONLY from process.env — never from client-facing constants
  const accessCode = process.env.ACCESS_CODE
  if (!accessCode) {
    console.error('[auth/verify] ACCESS_CODE environment variable is not set')
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 })
  }

  if (typeof code !== 'string' || code !== accessCode) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 })
  }

  const token = await signAuthCookie()
  const cookieHeader = buildCookieHeader(token)

  return NextResponse.json(
    { success: true },
    { status: 200, headers: { 'Set-Cookie': cookieHeader } },
  )
}
