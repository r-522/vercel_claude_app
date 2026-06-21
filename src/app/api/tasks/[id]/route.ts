import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { decryptGitHubToken } from '@/lib/github/token'
import { getFileWithSha, upsertFile } from '@/lib/github/client'
import { AUTH_COOKIE_NAME, GITHUB_COOKIE_NAME, TASKS_COOKIE_NAME, TASKS_FILE_PATH } from '@/lib/constants'
import type { TasksFile, TasksSettings } from '@/lib/tasks/types'

export const runtime = 'nodejs'

async function getTasksAuth(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<{ ghToken: string; settings: TasksSettings } | null> {
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!authToken || !(await verifyAuthCookie(authToken))) return null

  const ghEncrypted = cookieStore.get(GITHUB_COOKIE_NAME)?.value
  if (!ghEncrypted) return null

  const ghToken = await decryptGitHubToken(ghEncrypted)
  if (!ghToken) return null

  const raw = cookieStore.get(TASKS_COOKIE_NAME)?.value
  if (!raw) return null

  try {
    const settings = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')) as TasksSettings
    if (!settings.repo || !settings.branch) return null
    return { ghToken, settings }
  } catch {
    return null
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const cookieStore = await cookies()
  const auth = await getTasksAuth(cookieStore)
  if (!auth) return new Response('Unauthorized', { status: 401 })

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { name, prompt, outputPath, enabled } = body as {
    name?: string
    prompt?: string
    outputPath?: string
    enabled?: boolean
  }

  try {
    const existing = await getFileWithSha(auth.ghToken, auth.settings.repo, TASKS_FILE_PATH, auth.settings.branch)
    if (!existing) return NextResponse.json({ error: 'Tasks file not found' }, { status: 404 })

    const file = JSON.parse(existing.content) as TasksFile
    const taskIndex = file.tasks.findIndex((t) => t.id === id)
    if (taskIndex === -1) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const task = file.tasks[taskIndex]!
    file.tasks[taskIndex] = {
      ...task,
      ...(name !== undefined && { name: name.trim() }),
      ...(prompt !== undefined && { prompt: prompt.trim() }),
      ...(outputPath !== undefined && { outputPath: outputPath.trim() }),
      ...(enabled !== undefined && { enabled }),
    }
    file.updatedAt = new Date().toISOString()

    await upsertFile(
      auth.ghToken,
      auth.settings.repo,
      TASKS_FILE_PATH,
      JSON.stringify(file, null, 2),
      'chore: update scheduled task',
      auth.settings.branch,
      existing.sha,
    )

    return NextResponse.json(file.tasks[taskIndex])
  } catch {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 502 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const cookieStore = await cookies()
  const auth = await getTasksAuth(cookieStore)
  if (!auth) return new Response('Unauthorized', { status: 401 })

  const { id } = await params

  try {
    const existing = await getFileWithSha(auth.ghToken, auth.settings.repo, TASKS_FILE_PATH, auth.settings.branch)
    if (!existing) return NextResponse.json({ error: 'Tasks file not found' }, { status: 404 })

    const file = JSON.parse(existing.content) as TasksFile
    const filtered = file.tasks.filter((t) => t.id !== id)
    if (filtered.length === file.tasks.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    file.tasks = filtered
    file.updatedAt = new Date().toISOString()

    await upsertFile(
      auth.ghToken,
      auth.settings.repo,
      TASKS_FILE_PATH,
      JSON.stringify(file, null, 2),
      'chore: remove scheduled task',
      auth.settings.branch,
      existing.sha,
    )

    return new Response(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 502 })
  }
}
