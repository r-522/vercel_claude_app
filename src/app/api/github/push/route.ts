import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { decryptGitHubToken } from '@/lib/github/token'
import { createBranchAndPush } from '@/lib/github/client'
import { AUTH_COOKIE_NAME, GITHUB_COOKIE_NAME } from '@/lib/constants'

export const runtime = 'nodejs'

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/
const BRANCH_PATTERN = /^[\w./-]+$/

interface PushRequestBody {
  repo?: string
  baseBranch?: string
  newBranch?: string
  files?: Array<{ path?: string; content?: string }>
  message?: string
}

export async function POST(request: NextRequest): Promise<Response> {
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

  let body: PushRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { repo, baseBranch, newBranch, files, message } = body

  if (!repo || !REPO_PATTERN.test(repo)) {
    return NextResponse.json({ error: 'Invalid repo' }, { status: 400 })
  }
  if (!baseBranch || !BRANCH_PATTERN.test(baseBranch)) {
    return NextResponse.json({ error: 'Invalid base branch' }, { status: 400 })
  }
  if (!newBranch || !BRANCH_PATTERN.test(newBranch)) {
    return NextResponse.json({ error: 'Invalid new branch' }, { status: 400 })
  }
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: 'No files to push' }, { status: 400 })
  }
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Commit message required' }, { status: 400 })
  }

  const validFiles = files.filter(
    (f): f is { path: string; content: string } =>
      typeof f.path === 'string' &&
      f.path.length > 0 &&
      !f.path.includes('..') &&
      typeof f.content === 'string',
  )

  if (validFiles.length === 0) {
    return NextResponse.json({ error: 'No valid files' }, { status: 400 })
  }

  const result = await createBranchAndPush(ghToken, {
    repo,
    baseBranch,
    newBranch,
    files: validFiles,
    message,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ success: true, branchUrl: result.branchUrl })
}
