# Backend / API Rules

Related: [security rules](./security.md), [api rules](./api.md), [nextjs rules](./nextjs.md)

## Auth Verification (Defense-in-Depth)
Every protected route handler must call `verifyAuthCookie` at the start, independently of middleware:
```ts
import { verifyAuthCookie } from '@/lib/auth/cookies';

export async function POST(req: NextRequest) {
  const payload = await verifyAuthCookie(req);
  if (!payload) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... handler logic
}
```
This is not redundant — middleware (`proxy.ts`) is a first line of defense, not a guarantee. Route-level verification is authoritative.

## Input Validation
Validate all fields from `request.json()` before use. Do not trust client-supplied model IDs, effort levels, or message structures:
```ts
const body = await req.json().catch(() => null);
if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

const modelId = ALLOWED_MODEL_IDS.includes(body.model) ? body.model : DEFAULT_MODEL_ID;
```

## Model ID Validation
Server-side model ID validation is mandatory. Use the `ALLOWED_MODEL_IDS` whitelist derived from the `MODELS` constant:
```ts
// src/lib/constants.ts
export const ALLOWED_MODEL_IDS = MODELS.map(m => m.id);

// route handler
const safeModelId = ALLOWED_MODEL_IDS.includes(body.model)
  ? body.model
  : DEFAULT_MODEL_ID;
```
If the client sends an invalid model ID, silently fall back to `DEFAULT_MODEL_ID` — do not expose the whitelist in the error response.

## Error Responses for Auth Failures
Return identical messages regardless of the failure reason to prevent enumeration:
```ts
// wrong — reveals whether the code matched
if (!codeMatch) return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

// correct — same message for all failure paths
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

## Streaming Responses
Always use `streamText` from the AI SDK and return via `toUIMessageStreamResponse()`. Never buffer the entire completion before responding:
```ts
const result = streamText({ model, messages, system });
return result.toUIMessageStreamResponse();
```
The chat route must have `export const runtime = 'nodejs'` — see [nextjs rules](./nextjs.md).

## Rate Limiting Order
`checkRateLimit` MUST be called before any secret comparison. This is a timing-attack mitigation — comparing secrets takes variable time and could leak information if rate limiting comes after:
```ts
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { allowed } = checkRateLimit(ip); // FIRST
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { code } = await req.json();
  const accessCode = process.env.ACCESS_CODE; // AFTER rate limit check
  ...
}
```

## Environment Variable Access
`ACCESS_CODE` must only be read from `process.env` inside server-side code. Never assign it to a variable exported from `constants.ts` or any module that could be imported by client components:
```ts
// wrong — in constants.ts (client bundle risk)
export const ACCESS_CODE = process.env.ACCESS_CODE;

// correct — inline in server route only
const accessCode = process.env.ACCESS_CODE;
if (!accessCode) throw new Error('ACCESS_CODE not set');
```

## Logging
- Use `console.error` for unexpected server errors
- Never log: access codes, cookie values, JWT tokens, or user message content
- Error objects are safe to log; request bodies are not
