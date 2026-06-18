# API Endpoint Specification: [Method] [Path]

**Date:** YYYY-MM-DD
**Author:**
**Status:** draft | accepted | deprecated

---

## Endpoint
```
[METHOD] /api/[path]
```

## Purpose
<!-- One sentence: what this endpoint does. -->

## Auth Required
- [ ] Yes — valid JWT in HTTP-only cookie (`auth-token`); enforced by `src/proxy.ts`
- [ ] No

## Runtime
- [ ] nodejs  — required for streaming / `streamText`
- [ ] edge    — stateless, no Node.js APIs

## Request Body

```typescript
interface RequestBody {
  // Define fields and types
}
```

## Response

**Success (`200`)**
```typescript
interface SuccessResponse {
  // Define shape
}
```

*If streaming: describe the SSE/data-stream format (ai SDK `streamText` data protocol).*

## Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Invalid / missing required field | `{ error: string }` |
| 401 | Missing or invalid JWT | redirect to /auth (handled by middleware) |
| 429 | Rate limit exceeded | `{ error: string }` |
| 500 | Unexpected server error | `{ error: string }` |

## Rate Limited
- [ ] Yes — uses `src/lib/auth/rate-limiter.ts`; in-memory, not persistent across Vercel instances
- [ ] No

## Example Request

```http
POST /api/[path]
Content-Type: application/json
Cookie: auth-token=<jwt>

{
}
```

## Example Response

```json
{
}
```

---

# Example — POST /api/chat

**Date:** 2025-01-01
**Status:** accepted

## Endpoint
```
POST /api/chat
```

## Purpose
Accepts a conversation history and streams a Claude model response back to the client
using the ai SDK data stream protocol.

## Auth Required
- [x] Yes — valid JWT in HTTP-only cookie (`auth-token`); enforced by `src/proxy.ts`

## Runtime
- [x] nodejs — required for `streamText` and the Anthropic provider

## Request Body

```typescript
interface ChatRequestBody {
  messages: ModelMessage[];   // ai SDK message format (convertToModelMessages applied server-side)
  modelId: string;            // validated against ALLOWED_MODEL_IDS
  effortId: string;           // key in EFFORT_LEVELS
  enableThinking: boolean;    // extended thinking toggle; only honoured for supportsThinking models
}
```

## Response

**Success (`200`)** — SSE data stream (ai SDK `streamText` / `toDataStreamResponse`)

The stream emits text deltas and reasoning block deltas according to the ai SDK data
protocol. The client's `useChat` hook (with `experimental_streamData`) consumes these.

## Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | `modelId` not in `ALLOWED_MODEL_IDS` | `{ error: "Invalid model" }` |
| 400 | Missing `messages` | `{ error: "messages required" }` |
| 401 | JWT absent or expired | Middleware redirects to /auth before route handler runs |
| 500 | Anthropic API error | `{ error: "Internal server error" }` |

## Rate Limited
- [ ] No — chat route relies on Anthropic API key limits; the rate limiter is only on /api/auth/verify

## Example Request

```http
POST /api/chat
Content-Type: application/json
Cookie: auth-token=<signed-jwt>

{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "modelId": "claude-haiku-4-5-20251001",
  "effortId": "high",
  "enableThinking": false
}
```

## Example Response

```
data: {"type":"text-delta","textDelta":"Hello"}
data: {"type":"text-delta","textDelta":"! How can I help you today?"}
data: [DONE]
```
