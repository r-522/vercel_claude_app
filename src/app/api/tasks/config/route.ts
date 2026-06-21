import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { AUTH_COOKIE_NAME, TASKS_COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/constants'
import type { TasksSettings } from '@/lib/tasks/types'

export const runtime = 'nodejs'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!authToken || !(await verifyAuthCookie(authToken))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const raw = cookieStore.get(TASKS_COOKIE_NAME)?.value
  if (!raw) return NextResponse.json({ configured: false })

  try {
    const settings = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')) as TasksSettings
    if (!settings.repo || !settings.branch) return NextResponse.json({ configured: false })
    return NextResponse.json({ configured: true, repo: settings.repo, branch: settings.branch })
  } catch {
    return NextResponse.json({ configured: false })
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!authToken || !(await verifyAuthCookie(authToken))) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { repo, branch } = body as { repo?: string; branch?: string }
  if (!repo?.trim() || !branch?.trim()) {
    return NextResponse.json({ error: 'repo and branch are required' }, { status: 400 })
  }

  const settings: TasksSettings = { repo: repo.trim(), branch: branch.trim() }
  const cookieValue = Buffer.from(JSON.stringify(settings), 'utf-8').toString('base64')
  const isProduction = process.env.NODE_ENV === 'production'

  const cookieHeader = [
    `${TASKS_COOKIE_NAME}=${cookieValue}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    isProduction ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')

  return new Response(JSON.stringify({ configured: true, repo: settings.repo, branch: settings.branch }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieHeader },
  })
}
