import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { decryptGitHubToken } from '@/lib/github/token'
import { listRepos } from '@/lib/github/client'
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
    return NextResponse.json({ error: 'GitHub not connected' }, { status: 401 })
  }

  const ghToken = await decryptGitHubToken(ghEncrypted)
  if (!ghToken) {
    return NextResponse.json({ error: 'GitHub token invalid' }, { status: 401 })
  }

  try {
    const repos = await listRepos(ghToken)
    return NextResponse.json(repos)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch repos' }, { status: 502 })
  }
}
