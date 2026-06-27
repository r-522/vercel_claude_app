import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { decryptGitHubToken } from '@/lib/github/token'
import { getFileWithSha, upsertFile } from '@/lib/github/client'
import {
  AUTH_COOKIE_NAME, GITHUB_COOKIE_NAME, TASKS_COOKIE_NAME,
  TASKS_FILE_PATH, DEFAULT_MODEL_ID, TASK_WEB_SEARCH_MAX_USES, TASK_MAX_STEPS,
} from '@/lib/constants'
import { buildTaskPrompt, getJSTDateString, parseStateUpdate, stripStateBlock } from '@/lib/tasks/utils'
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

    const resultRepo = task.targetRepo || settings.repo
    const resultBranch = task.targetBranch || settings.branch

    // Read state file if configured
    let stateContent: string | undefined
    if (task.stateFilePath) {
      try {
        const stateFile = await getFileWithSha(ghToken, resultRepo, task.stateFilePath, resultBranch)
        if (stateFile) stateContent = stateFile.content
      } catch {
        // State file doesn't exist yet — first run
      }
    }

    const fullPrompt = buildTaskPrompt(task.prompt, stateContent)

    const { text } = await generateText({
      model: anthropic(DEFAULT_MODEL_ID),
      prompt: fullPrompt,
      ...(task.webSearch ? {
        tools: { web_search: anthropic.tools.webSearch_20250305({ maxUses: TASK_WEB_SEARCH_MAX_USES }) },
        maxSteps: TASK_MAX_STEPS,
      } : {}),
    })

    // Parse and save state update if present
    if (task.stateFilePath) {
      const stateUpdate = parseStateUpdate(text)
      if (stateUpdate) {
        const existingState = await getFileWithSha(ghToken, resultRepo, task.stateFilePath, resultBranch).catch(() => null)
        await upsertFile(ghToken, resultRepo, task.stateFilePath, stateUpdate, 'chore: update task state', resultBranch, existingState?.sha)
      }
    }

    const cleanText = stripStateBlock(text)
    const now = new Date()
    const dateStr = getJSTDateString()
    const resultPath = `${task.outputPath}/${dateStr}/${task.id}.md`
    const resultContent = `# ${task.name}\n\n実行日時: ${now.toISOString()}\n\n---\n\n${cleanText}\n`

    const existingResult = await getFileWithSha(ghToken, resultRepo, resultPath, resultBranch).catch(() => null)
    await upsertFile(ghToken, resultRepo, resultPath, resultContent, `task: run ${task.name}`, resultBranch, existingResult?.sha)

    // Update lastRunAt in tasks file (always in the config repo)
    const taskIndex = file.tasks.findIndex((t) => t.id === id)
    if (taskIndex !== -1) {
      file.tasks[taskIndex] = { ...file.tasks[taskIndex]!, lastRunAt: now.toISOString() }
      file.updatedAt = now.toISOString()
      const fresh = await getFileWithSha(ghToken, settings.repo, TASKS_FILE_PATH, settings.branch)
      await upsertFile(ghToken, settings.repo, TASKS_FILE_PATH, JSON.stringify(file, null, 2), 'chore: update task lastRunAt', settings.branch, fresh?.sha)
    }

    return NextResponse.json({ result: cleanText, resultPath })
  } catch {
    return NextResponse.json({ error: 'Task execution failed' }, { status: 502 })
  }
}
