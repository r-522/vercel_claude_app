# Node.js Runtime Rules

Related: [nextjs rules](./nextjs.md), [backend rules](./backend.md)

## Runtime Declaration
Any Next.js route that uses Node.js-only features must declare:
```ts
export const runtime = 'nodejs';
```

Routes that require this declaration in this project:
- `src/app/api/chat/route.ts` — uses AI SDK streaming (Node.js streams)
- `src/app/api/auth/verify/route.ts` — uses `jose` (Node.js `crypto`) and in-memory rate limiter

Without this declaration, Next.js may deploy the route to the Edge runtime on Vercel, which will fail silently or with cryptic errors.

## In-Memory State Limitations
`src/lib/auth/rate-limiter.ts` uses a module-level `Map` for rate limit tracking. This has important implications:
- State is NOT shared across Vercel function instances (each cold start gets a fresh Map)
- State is NOT persisted across deployments
- In production, a single user can exceed the rate limit on one instance while another instance allows them through

This is an acceptable trade-off for this project (low traffic, single developer). If stricter rate limiting is needed, replace with a Redis/KV store. Document any change to this contract in `context/decisions.md`.

## Environment Variable Access
`process.env` is only available in server-side code:
- Server components (no `'use client'`)
- API route handlers
- `src/lib/auth/` modules
- `proxy.ts` (middleware)

Never access `process.env` in:
- Client components (`'use client'` files)
- `src/lib/constants.ts` (imported by client components)
- Hooks in `src/hooks/` (run client-side)

Exception: `NEXT_PUBLIC_` variables are injected at build time and safe for client use — this project has none currently.

## Dev Server
The development server runs via fnm-managed Node.js:
- Node.js path: `C:\Users\ikere\AppData\Roaming\fnm\node-versions\v22.13.1\installation`
- Always use `npm run dev` (not `node server.js` or `npx next dev` directly) to ensure the correct Next.js config loads

## npm Scripts
```
npm run dev         # start development server (Next.js with Turbopack)
npm run build       # production build
npm run type-check  # tsc --noEmit (no output, type errors only)
npm run lint        # ESLint with next/core-web-vitals config
```
Run `type-check` and `lint` before every commit. There is no CI/CD to catch these automatically.

## Node Version
Node.js v22.13.1 (LTS). Do not introduce code that requires v23+ features. Do not lower the minimum to v18 without testing the entire dependency tree.
