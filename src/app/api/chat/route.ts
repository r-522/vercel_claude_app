import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import {
  ALLOWED_MODEL_IDS,
  DEFAULT_MODEL_ID,
  SYSTEM_PROMPT,
  AUTH_COOKIE_NAME,
} from '@/lib/constants'
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

  let body: { id?: string; messages?: UIMessage[]; modelId?: string }
  try {
    body = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { messages, modelId } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Bad Request', { status: 400 })
  }

  // Validate modelId — fall back to default if unknown or missing
  const resolvedModel = ALLOWED_MODEL_IDS.includes(modelId ?? '')
    ? (modelId as string)
    : DEFAULT_MODEL_ID

  const result = streamText({
    model: anthropic(resolvedModel),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse()
}
