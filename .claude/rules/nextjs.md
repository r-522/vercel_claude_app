# Next.js App Router Rules

Related: [backend rules](./backend.md), [security rules](./security.md), [api rules](./api.md)

## Server vs Client Components
Default to Server Components. Add `'use client'` only when the component requires:
- React hooks or browser APIs
- Event listeners
- Real-time state or interactivity

Server components can import and render Client components. The reverse is not true.

Layout files (`layout.tsx`) are Server Components by default — do not add `'use client'` unless required. The current `layout.tsx` uses an inline `<script>` for dark mode initialization, which is valid in a Server Component.

## API Route Auth (Defense-in-Depth)
Every API route handler that serves protected data must call `verifyAuthCookie` independently, even though `proxy.ts` middleware already runs:
```ts
// src/app/api/chat/route.ts
export async function POST(req: NextRequest) {
  const payload = await verifyAuthCookie(req); // never skip
  if (!payload) return new Response('Unauthorized', { status: 401 });
  ...
}
```
Middleware can be bypassed by Vercel edge configuration changes. Route-level verification is the authoritative check.

## Runtime Declaration
Routes using `jose`, in-memory state, or any Node.js-only module must declare the Node.js runtime:
```ts
export const runtime = 'nodejs';
```
Without this, Next.js may route to the Edge runtime, which does not support:
- `jose` (uses Node crypto)
- In-memory `Map` state (rate limiter)
- Node.js `crypto` module

The streaming chat route and auth verify route both require `runtime = 'nodejs'`.

## Middleware (proxy.ts)
Keep `proxy.ts` lightweight:
- Only JWT verification logic — no database calls, no heavy imports
- Import only from `src/lib/auth/cookies.ts` and `next/server`
- Never import React, AI SDK, or large third-party libraries here
- Matcher config should exclude static files and `_next` assets

## Route Handler Return Types
Route handlers must return `Response` or `NextResponse`, never plain objects:
```ts
// correct
return NextResponse.json({ error: 'Bad request' }, { status: 400 });
return new Response('Unauthorized', { status: 401 });

// wrong — Next.js will not serialize this correctly
return { error: 'Bad request' };
```

## Dynamic Images (`<img>` tags)
When displaying user-uploaded images or dynamic Blob URLs, use a plain `<img>` tag with an eslint disable comment explaining why `next/image` is not appropriate:
```tsx
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={previewUrl} alt="attachment preview" className="max-h-32 rounded" />
```
`next/image` requires a known domain for external images and does not support `blob:` URLs.

## Environment Variables
- Server-only secrets (`ACCESS_CODE`, `COOKIE_SECRET`, `ANTHROPIC_API_KEY`) must NEVER appear in `next.config.ts` `publicRuntimeConfig` or `env` (client-exposed) sections.
- Only variables prefixed `NEXT_PUBLIC_` are safe for client code — this project has none.
- Access server vars exclusively via `process.env` in server components and API routes.
- See [security rules](./security.md) for full secret handling policy.

## `lang` Attribute
`layout.tsx` sets `lang="ja"` on `<html>`. Do not change this — the UI is in Japanese.

## `next.config.ts`
Do not add `reactStrictMode: false` — double-render in dev is intentional behavior for detecting side-effect issues.
