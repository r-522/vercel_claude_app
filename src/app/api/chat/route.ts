import { NextRequest } from 'next/server'
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
  SYSTEM_PROMPT,
  AUTH_COOKIE_NAME,
  WEB_SEARCH_MAX_USES,
} from '@/lib/constants'
import type { EffortId } from '@/lib/constants'
import type { UIMessage } from 'ai'

// Node.js runtime — required for in-memory rate limiter and jose Node.js APIs
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Defense-in-depth: verify auth cookie independently of proxy
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token || !(await verifyAuthCookie(token))) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: {
    id?: string
    messages?: UIMessage[]
    modelId?: string
    effort?: EffortId
    thinking?: boolean
    webSearch?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { messages, modelId, effort, thinking, webSearch } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Bad Request', { status: 400 })
  }

  // Validate modelId — fall back to default if unknown or missing
  const resolvedModel = ALLOWED_MODEL_IDS.includes(modelId ?? '')
    ? (modelId as string)
    : DEFAULT_MODEL_ID

  const effortLevel =
    EFFORT_LEVELS.find((e) => e.id === effort) ??
    EFFORT_LEVELS.find((e) => e.id === DEFAULT_EFFORT_ID)!

  const modelMeta = MODELS.find((m) => m.id === resolvedModel)
  const applyThinking = thinking === true && modelMeta?.supportsThinking === true

  // Anthropic server-side web search — only enabled when the client strictly opts in
  const applyWebSearch = webSearch === true

  const result = streamText({
    model: anthropic(resolvedModel),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    ...(applyWebSearch
      ? {
          tools: {
            web_search: anthropic.tools.webSearch_20250305({ maxUses: WEB_SEARCH_MAX_USES }),
          },
        }
      : {}),
    ...(applyThinking
      ? {
          providerOptions: {
            anthropic: { thinking: { type: 'enabled', budgetTokens: effortLevel.budgetTokens } },
          },
        }
      : { temperature: effortLevel.temperature }),
  })

  // sendSources surfaces web-search citations as source-url parts for the UI
  return result.toUIMessageStreamResponse({ sendSources: true })
}
