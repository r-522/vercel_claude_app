import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { encryptGitHubToken } from '@/lib/github/token'
import { AUTH_COOKIE_NAME, GITHUB_COOKIE_NAME, GITHUB_STATE_COOKIE_NAME } from '@/lib/constants'
import { GITHUB_OAUTH_TOKEN } from '@/lib/github/constants'

export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<Response> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!authToken || !(await verifyAuthCookie(authToken))) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const storedState = cookieStore.get(GITHUB_STATE_COOKIE_NAME)?.value

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/?github_error=invalid_state', request.url))
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?github_error=not_configured', request.url))
  }

  const tokenRes = await fetch(GITHUB_OAUTH_TOKEN, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/?github_error=token_exchange_failed', request.url))
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL('/?github_error=no_token', request.url))
  }

  const encrypted = await encryptGitHubToken(tokenData.access_token)

  const response = NextResponse.redirect(new URL('/', request.url))

  response.cookies.set(GITHUB_COOKIE_NAME, encrypted, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  response.cookies.delete(GITHUB_STATE_COOKIE_NAME)

  return response
}
