# Skill: API Endpoint Design

Use this workflow when adding a new API route to the Claude AI Chat App.

## Endpoint Structure

All API routes live at `src/app/api/<name>/route.ts` (Next.js App Router convention).

File naming:
- One route per directory: `src/app/api/feature/route.ts`
- HTTP method as exported function: `export async function POST(req: Request)`
- No nested routes unless grouping related endpoints (e.g., `api/auth/verify`, `api/auth/logout`)

## Required Boilerplate for Every Route

```ts
// src/app/api/feature/route.ts
export const runtime = 'nodejs'
```

This MUST be at the top of every API route file. Without it, Next.js may run the route on the Edge runtime, which lacks Node.js APIs required by `jose` and `@ai-sdk/anthropic`.

## Auth Verification Pattern

Copy this exact block into every protected route (all routes except `api/auth/*`):

```ts
import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { AUTH_COOKIE_NAME } from '@/lib/constants'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return new Response('Unauthorized', { status: 401 })

  try {
    await verifyAuthCookie(token)
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  // ... route logic
}
```

The auth check must be the FIRST thing in the handler — before parsing the body or doing any work.

## Body Validation Pattern

Parse and validate request body before use:

```ts
let body: unknown
try {
  body = await req.json()
} catch {
  return new Response('Bad Request', { status: 400 })
}

// Validate required fields
if (typeof body !== 'object' || body === null) {
  return new Response('Bad Request', { status: 400 })
}

const { modelId, message } = body as { modelId?: unknown; message?: unknown }

if (typeof modelId !== 'string' || !ALLOWED_MODEL_IDS.includes(modelId)) {
  return new Response('Bad Request', { status: 400 })
}
if (typeof message !== 'string' || message.trim() === '') {
  return new Response('Bad Request', { status: 400 })
}
```

Never use `as SpecificType` on the raw parsed body — always validate field-by-field.

## Streaming vs JSON Response

**Use streaming** when:
- Response is generated incrementally (e.g., LLM output)
- Client needs to display partial results
- Response could be large

Pattern (from `src/app/api/chat/route.ts`):
```ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const result = streamText({
  model: anthropic(modelId),
  messages,
})
return result.toDataStreamResponse()
```

**Use JSON response** when:
- Response is a single value known before it is complete
- Response is small (auth tokens, status, config)

Pattern:
```ts
return Response.json({ success: true, data: value })
// or for errors:
return new Response('Not Found', { status: 404 })
```

## Error Response Format

Be consistent:
- `400` — Bad Request: malformed body or invalid input
- `401` — Unauthorized: missing or invalid auth cookie
- `404` — Not Found: resource does not exist
- `405` — Method Not Allowed: handled automatically by Next.js if the method function is not exported
- `429` — Too Many Requests: rate limit exceeded
- `500` — Internal Server Error: unexpected failure (avoid exposing details in body)

For 4xx errors, return a plain text body describing the issue:
```ts
return new Response('Invalid model ID', { status: 400 })
```

For 5xx errors, return a generic message — do not leak stack traces or internal details:
```ts
return new Response('Internal Server Error', { status: 500 })
```

## Runtime Declaration

```ts
export const runtime = 'nodejs'
```

Place this at the top of the file, before any exports. It must be a static string literal — not a variable.

This forces the route to run in the Node.js runtime (not Edge). Required for:
- `jose` (JWT operations)
- `@ai-sdk/anthropic` (Anthropic SDK streaming)
- Any Node.js built-in (`crypto`, `fs`, etc.)

## Complete Example Route

```ts
// src/app/api/summarize/route.ts
export const runtime = 'nodejs'

import { cookies } from 'next/headers'
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { AUTH_COOKIE_NAME, ALLOWED_MODEL_IDS } from '@/lib/constants'

export async function POST(req: Request) {
  // 1. Auth
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return new Response('Unauthorized', { status: 401 })
  try {
    await verifyAuthCookie(token)
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { text } = body as { text?: unknown }
  if (typeof text !== 'string' || text.trim() === '') {
    return new Response('Bad Request', { status: 400 })
  }

  // 3. Logic
  const summary = text.slice(0, 100) // placeholder

  // 4. Response
  return Response.json({ summary })
}
```
