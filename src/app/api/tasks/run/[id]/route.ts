import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { decryptGitHubToken } from '@/lib/github/token'
import { getFileWithSha, upsertFile } from '@/lib/github/client'
import { AUTH_COOKIE_NAME, GITHUB_COOKIE_NAME, TASKS_COOKIE_NAME, TASKS_FILE_PATH, DEFAULT_MODEL_ID } from '@/lib/constants'
import type { TasksFile, TasksSettings } from '@/lib/tasks/types'

export const runtime = 'nodejs'

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!authToken || !(await verifyAuthCookie(authToken))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const ghEncrypted = cookieStore.get(GITHUB_COOKIE_NAME)?.value
  if (!ghEncrypted) return NextResponse.json({ error: 'GitHub not connected' }, { status: 401 })

  const ghToken = await decryptGitHubToken(ghEncrypted)
  if (!ghToken) return NextResponse.json({ error: 'GitHub token invalid' }, { status: 401 })

  const raw = cookieStore.get(TASKS_COOKIE_NAME)?.value
  if (!raw) return NextResponse.json({ error: 'Tasks not configured' }, { status: 400 })

  let settings: TasksSettings
  try {
    settings = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')) as TasksSettings
  } catch {
    return NextResponse.json({ error: 'Invalid tasks config' }, { status: 400 })
  }

  const { id } = await params

  try {
    const existing = await getFileWithSha(ghToken, settings.repo, TASKS_FILE_PATH, settings.branch)
    if (!existing) return NextResponse.json({ error: 'Tasks file not found' }, { status: 404 })

    const file = JSON.parse(existing.content) as TasksFile
    const task = file.tasks.find((t) => t.id === id)
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const { text } = await generateText({ model: anthropic(DEFAULT_MODEL_ID), prompt: task.prompt })

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]!
    const resultPath = `${task.outputPath}/${dateStr}/${task.id}.md`
    const resultContent = `# ${task.name}\n\n実行日時: ${now.toISOString()}\n\n---\n\n${text}\n`

    // Push result to GitHub
    const existingResult = await getFileWithSha(ghToken, settings.repo, resultPath, settings.branch)
    await upsertFile(ghToken, settings.repo, resultPath, resultContent, `task: run ${task.name}`, settings.branch, existingResult?.sha)

    // Update lastRunAt in tasks file
    const taskIndex = file.tasks.findIndex((t) => t.id === id)
    if (taskIndex !== -1) {
      file.tasks[taskIndex] = { ...file.tasks[taskIndex]!, lastRunAt: now.toISOString() }
      file.updatedAt = now.toISOString()
      const fresh = await getFileWithSha(ghToken, settings.repo, TASKS_FILE_PATH, settings.branch)
      await upsertFile(ghToken, settings.repo, TASKS_FILE_PATH, JSON.stringify(file, null, 2), 'chore: update task lastRunAt', settings.branch, fresh?.sha)
    }

    return NextResponse.json({ result: text, resultPath })
  } catch {
    return NextResponse.json({ error: 'Task execution failed' }, { status: 502 })
  }
}
