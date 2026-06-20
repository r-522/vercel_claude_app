import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { decryptGitHubToken } from '@/lib/github/token'
import { getUser } from '@/lib/github/client'
import { AUTH_COOKIE_NAME, GITHUB_COOKIE_NAME } from '@/lib/constants'

export const runtime = 'nodejs'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!authToken || !(await verifyAuthCookie(authToken))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const ghEncrypted = cookieStore.get(GITHUB_COOKIE_NAME)?.value
  if (!ghEncrypted) {
    return NextResponse.json({ connected: false })
  }

  const ghToken = await decryptGitHubToken(ghEncrypted)
  if (!ghToken) {
    return NextResponse.json({ connected: false })
  }

  try {
    const user = await getUser(ghToken)
    return NextResponse.json({
      connected: true,
      user,
    })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
