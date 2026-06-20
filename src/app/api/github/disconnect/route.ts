import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { AUTH_COOKIE_NAME, GITHUB_COOKIE_NAME } from '@/lib/constants'

export const runtime = 'nodejs'

export async function POST(): Promise<Response> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token || !(await verifyAuthCookie(token))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete(GITHUB_COOKIE_NAME)
  return response
}
