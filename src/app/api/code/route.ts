import type { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import {
  ALLOWED_MODEL_IDS,
  DEFAULT_MODEL_ID,
  DEFAULT_EFFORT_ID,
  EFFORT_LEVELS,
  MODELS,
  CODE_SYSTEM_PROMPT,
  AUTH_COOKIE_NAME,
} from '@/lib/constants'
import type { EffortId } from '@/lib/constants'
import type { UIMessage } from 'ai'
import type { ContextFile } from '@/lib/github/types'

export const runtime = 'nodejs'

interface CodeRequestBody {
  id?: string
  messages?: UIMessage[]
  modelId?: string
  effort?: EffortId
  thinking?: boolean
  repoContext?: {
    repo: string
    branch: string
    files: ContextFile[]
  }
}

function buildSystemPrompt(repoContext?: CodeRequestBody['repoContext']): string {
  if (!repoContext || repoContext.files.length === 0) {
    return CODE_SYSTEM_PROMPT
  }

  const fileSection = repoContext.files
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join('\n\n')

  return `${CODE_SYSTEM_PROMPT}

You are working on the repository **${repoContext.repo}** (branch: \`${repoContext.branch}\`).

The following files have been provided as context:

${fileSection}`
}

export async function POST(request: NextRequest): Promise<Response> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token || !(await verifyAuthCookie(token))) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: CodeRequestBody
  try {
    body = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { messages, modelId, effort, thinking, repoContext } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Bad Request', { status: 400 })
  }

  const resolvedModel = ALLOWED_MODEL_IDS.includes(modelId ?? '')
    ? (modelId as string)
    : DEFAULT_MODEL_ID

  const effortLevel =
    EFFORT_LEVELS.find((e) => e.id === effort) ??
    EFFORT_LEVELS.find((e) => e.id === DEFAULT_EFFORT_ID)!

  const modelMeta = MODELS.find((m) => m.id === resolvedModel)
  const applyThinking = thinking === true && modelMeta?.supportsThinking === true

  const result = streamText({
    model: anthropic(resolvedModel),
    system: buildSystemPrompt(repoContext),
    messages: await convertToModelMessages(messages),
    ...(applyThinking
      ? {
          providerOptions: {
            anthropic: { thinking: { type: 'enabled', budgetTokens: effortLevel.budgetTokens } },
          },
        }
      : { temperature: effortLevel.temperature }),
  })

  return result.toUIMessageStreamResponse()
}
