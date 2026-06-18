# API Design Rules

Related: [backend rules](./backend.md), [security rules](./security.md), [nextjs rules](./nextjs.md)

## Route Location
All API routes live under `src/app/api/` following Next.js App Router conventions:
```
src/app/api/
  chat/route.ts          # POST /api/chat
  auth/verify/route.ts   # POST /api/auth/verify
  auth/logout/route.ts   # POST /api/auth/logout
```
Export named HTTP method functions (`GET`, `POST`, `PUT`, `DELETE`) — not a default export.

## HTTP Methods
- `POST` for all mutations: sending chat messages, logging in, logging out
- No `GET` for auth-sensitive operations — GET requests are logged in access logs, query params appear in URLs, and are not suitable for credentials or message content
- Chat messages are always `POST` regardless of conversational nature

## Response Format
```ts
// JSON responses
return NextResponse.json({ data }, { status: 200 });
return NextResponse.json({ error: 'Bad request' }, { status: 400 });

// Streaming response (chat)
return result.toUIMessageStreamResponse();

// Simple text response (auth)
return new Response('Unauthorized', { status: 401 });
```
Never return a bare object — always use `NextResponse.json` or `new Response`.

## Status Codes
| Code | When to use |
|------|-------------|
| 200  | Successful request |
| 400  | Malformed body, missing required field, JSON parse failure |
| 401  | Auth cookie missing, invalid, or expired |
| 429  | Rate limit exceeded |
| 500  | Unexpected server error (log it, return generic message) |

Do not use 403 for auth failures — this project uses 401 for all authentication failures.

## Auth Cookie Name
Always use the `AUTH_COOKIE_NAME` constant from `src/lib/constants.ts`. Never hardcode the string `'auth_session'`:
```ts
import { AUTH_COOKIE_NAME } from '@/lib/constants';

// correct
const cookie = req.cookies.get(AUTH_COOKIE_NAME);

// wrong
const cookie = req.cookies.get('auth_session');
```

## Body Parsing
Always wrap `req.json()` in a try/catch and return 400 on failure:
```ts
let body: unknown;
try {
  body = await req.json();
} catch {
  return NextResponse.json({ error: 'Bad request' }, { status: 400 });
}
```
Never let a JSON parse error bubble up to a 500.

## Streaming Chat Runtime
The chat route (`src/app/api/chat/route.ts`) must use the Node.js runtime:
```ts
export const runtime = 'nodejs';
```
The AI SDK's `streamText` and `toUIMessageStreamResponse` require Node.js streams. The Edge runtime does not support this combination. See [nextjs rules](./nextjs.md) for full reasoning.

## CORS
This project does not implement CORS headers. The API is only consumed by the same-origin Next.js frontend on Vercel. Do not add CORS headers unless the project specifically needs cross-origin access.
