import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { decryptGitHubToken } from '@/lib/github/token'
import { getContents, getFileContent } from '@/lib/github/client'
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
  const ref = request.nextUrl.searchParams.get('ref') ?? 'main'
  const path = request.nextUrl.searchParams.get('path') ?? ''
  const mode = request.nextUrl.searchParams.get('mode') // 'file' to get content

  if (!repo || !REPO_PATTERN.test(repo)) {
    return NextResponse.json({ error: 'Invalid repo parameter' }, { status: 400 })
  }

  if (path.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    if (mode === 'file') {
      const content = await getFileContent(ghToken, repo, path, ref)
      return NextResponse.json({ path, content })
    }

    const entries = await getContents(ghToken, repo, path, ref)
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contents' }, { status: 502 })
  }
}
