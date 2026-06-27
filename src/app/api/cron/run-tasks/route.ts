import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { getFileWithSha, upsertFile } from '@/lib/github/client'
import { TASKS_FILE_PATH, DEFAULT_MODEL_ID, TASK_WEB_SEARCH_MAX_USES, TASK_MAX_STEPS } from '@/lib/constants'
import { buildTaskPrompt, getJSTDateString, parseStateUpdate, shouldRunWeeklyTask, stripStateBlock } from '@/lib/tasks/utils'
import type { TasksFile } from '@/lib/tasks/types'

export const runtime = 'nodejs'

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
    const dateStr = getJSTDateString()
    let ran = 0

    for (const task of enabled) {
      // Skip weekly tasks that ran within the last 7 days
      if ((task.schedule ?? 'daily') === 'weekly' && !shouldRunWeeklyTask(task.lastRunAt)) {
        continue
      }

      try {
        const resultRepo = task.targetRepo || tasksRepo
        const resultBranch = task.targetBranch || tasksBranch

        // Read state file if configured
        let stateContent: string | undefined
        if (task.stateFilePath) {
          try {
            const stateFile = await getFileWithSha(ghPat, resultRepo, task.stateFilePath, resultBranch)
            if (stateFile) stateContent = stateFile.content
          } catch {
            // State file doesn't exist yet
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
            const existingState = await getFileWithSha(ghPat, resultRepo, task.stateFilePath, resultBranch).catch(() => null)
            await upsertFile(ghPat, resultRepo, task.stateFilePath, stateUpdate, 'chore: update task state', resultBranch, existingState?.sha)
          }
        }

        const cleanText = stripStateBlock(text)
        const resultPath = `${task.outputPath}/${dateStr}/${task.id}.md`
        const resultContent = `# ${task.name}\n\n実行日時: ${now.toISOString()}\n\n---\n\n${cleanText}\n`
        const existingResult = await getFileWithSha(ghPat, resultRepo, resultPath, resultBranch).catch(() => null)
        await upsertFile(ghPat, resultRepo, resultPath, resultContent, `task: run ${task.name}`, resultBranch, existingResult?.sha)

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
