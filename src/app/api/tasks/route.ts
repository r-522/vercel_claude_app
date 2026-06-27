import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { decryptGitHubToken } from '@/lib/github/token'
import { getFileWithSha, upsertFile } from '@/lib/github/client'
import { AUTH_COOKIE_NAME, GITHUB_COOKIE_NAME, TASKS_COOKIE_NAME, TASKS_FILE_PATH } from '@/lib/constants'
import type { ScheduledTask, TasksFile, TasksSettings } from '@/lib/tasks/types'

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

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const auth = await getTasksAuth(cookieStore)
  if (!auth) return new Response('Unauthorized', { status: 401 })

  try {
    const result = await getFileWithSha(auth.ghToken, auth.settings.repo, TASKS_FILE_PATH, auth.settings.branch)
    if (!result) return NextResponse.json({ tasks: [], updatedAt: '' } satisfies TasksFile)
    return NextResponse.json(JSON.parse(result.content) as TasksFile)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 502 })
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const cookieStore = await cookies()
  const auth = await getTasksAuth(cookieStore)
  if (!auth) return new Response('Unauthorized', { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const { name, prompt, outputPath, targetRepo, targetBranch, webSearch, schedule, stateFilePath } = body as {
    name?: string; prompt?: string; outputPath?: string
    targetRepo?: string; targetBranch?: string; webSearch?: boolean
    schedule?: 'daily' | 'weekly'; stateFilePath?: string
  }
  if (!name?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: 'name and prompt are required' }, { status: 400 })
  }

  try {
    const existing = await getFileWithSha(auth.ghToken, auth.settings.repo, TASKS_FILE_PATH, auth.settings.branch)
    const currentFile: TasksFile = existing
      ? (JSON.parse(existing.content) as TasksFile)
      : { tasks: [], updatedAt: '' }

    const newTask: ScheduledTask = {
      id: `task_${Date.now()}`,
      name: name.trim(),
      prompt: prompt.trim(),
      enabled: true,
      outputPath: outputPath?.trim() || 'results',
      createdAt: new Date().toISOString(),
      ...(targetRepo ? { targetRepo: targetRepo.trim() } : {}),
      ...(targetBranch ? { targetBranch: targetBranch.trim() } : {}),
      ...(webSearch !== undefined ? { webSearch } : {}),
      ...(schedule ? { schedule } : {}),
      ...(stateFilePath ? { stateFilePath: stateFilePath.trim() } : {}),
    }

    const updated: TasksFile = {
      tasks: [...currentFile.tasks, newTask],
      updatedAt: new Date().toISOString(),
    }

    await upsertFile(
      auth.ghToken,
      auth.settings.repo,
      TASKS_FILE_PATH,
      JSON.stringify(updated, null, 2),
      'chore: add scheduled task',
      auth.settings.branch,
      existing?.sha,
    )

    return NextResponse.json(newTask, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save task' }, { status: 502 })
  }
}
