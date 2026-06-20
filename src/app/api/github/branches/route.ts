import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { decryptGitHubToken } from '@/lib/github/token'
import { listBranches } from '@/lib/github/client'
import { AUTH_COOKIE_NAME, GITHUB_COOKIE_NAME } from '@/lib/constants'

export const runtime = 'nodejs'

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/

export async function GET(request: NextRequest): Promise<Response> {
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

  const repo = request.nextUrl.searchParams.get('repo')
  if (!repo || !REPO_PATTERN.test(repo)) {
    return NextResponse.json({ error: 'Invalid repo parameter' }, { status: 400 })
  }

  try {
    const branches = await listBranches(ghToken, repo)
    return NextResponse.json(branches)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 502 })
  }
}
