import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { getFileWithSha, upsertFile } from '@/lib/github/client'
import { TASKS_FILE_PATH, DEFAULT_MODEL_ID } from '@/lib/constants'
import type { TasksFile } from '@/lib/tasks/types'

export const runtime = 'nodejs'

// Called by Vercel Cron — no user session available.
// Requires env vars: CRON_SECRET, GITHUB_PAT, TASKS_REPO, TASKS_BRANCH
export async function POST(req: NextRequest): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const ghPat = process.env.GITHUB_PAT
  const tasksRepo = process.env.TASKS_REPO
  const tasksBranch = process.env.TASKS_BRANCH ?? 'main'

  if (!ghPat || !tasksRepo) {
    return NextResponse.json({ error: 'GITHUB_PAT and TASKS_REPO env vars required' }, { status: 503 })
  }

  try {
    const existing = await getFileWithSha(ghPat, tasksRepo, TASKS_FILE_PATH, tasksBranch)
    if (!existing) return NextResponse.json({ ran: 0, skipped: 0 })

    const file = JSON.parse(existing.content) as TasksFile
    const enabled = file.tasks.filter((t) => t.enabled)

    if (enabled.length === 0) return NextResponse.json({ ran: 0, skipped: 0 })

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]!
    let ran = 0

    for (const task of enabled) {
      try {
        const { text } = await generateText({ model: anthropic(DEFAULT_MODEL_ID), prompt: task.prompt })

        const resultPath = `${task.outputPath}/${dateStr}/${task.id}.md`
        const resultContent = `# ${task.name}\n\n実行日時: ${now.toISOString()}\n\n---\n\n${text}\n`
        const existingResult = await getFileWithSha(ghPat, tasksRepo, resultPath, tasksBranch)
        await upsertFile(ghPat, tasksRepo, resultPath, resultContent, `task: run ${task.name}`, tasksBranch, existingResult?.sha)

        const taskIdx = file.tasks.findIndex((t) => t.id === task.id)
        if (taskIdx !== -1) file.tasks[taskIdx] = { ...file.tasks[taskIdx]!, lastRunAt: now.toISOString() }
        ran++
      } catch {
        // Continue with next task on individual failure
      }
    }

    file.updatedAt = now.toISOString()
    const refreshed = await getFileWithSha(ghPat, tasksRepo, TASKS_FILE_PATH, tasksBranch)
    await upsertFile(ghPat, tasksRepo, TASKS_FILE_PATH, JSON.stringify(file, null, 2), 'chore: update task lastRunAt', tasksBranch, refreshed?.sha)

    return NextResponse.json({ ran, skipped: enabled.length - ran })
  } catch {
    return NextResponse.json({ error: 'Cron run failed' }, { status: 500 })
  }
}
