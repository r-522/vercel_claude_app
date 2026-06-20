import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { AUTH_COOKIE_NAME, GITHUB_STATE_COOKIE_NAME } from '@/lib/constants'
import { GITHUB_OAUTH_AUTHORIZE, GITHUB_OAUTH_SCOPE } from '@/lib/github/constants'

export const runtime = 'nodejs'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token || !(await verifyAuthCookie(token))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 })
  }

  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id: clientId,
    scope: GITHUB_OAUTH_SCOPE,
    state,
  })

  const url = `${GITHUB_OAUTH_AUTHORIZE}?${params.toString()}`

  const response = NextResponse.redirect(url)
  response.cookies.set(GITHUB_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  })

  return response
}
