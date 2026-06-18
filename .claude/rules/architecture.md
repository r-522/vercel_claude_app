# Architecture Rules

Related: [react rules](./react.md), [nextjs rules](./nextjs.md), [backend rules](./backend.md)

## Hooks over Component State
Extract logic to a custom hook when any of these are true:
- The same stateful logic appears in 2+ components
- A `useEffect` + related `useState` combination exceeds 5 lines
- Side-effect cleanup is required (MutationObserver, Blob URL lifecycle, timers)

Custom hooks live in `src/hooks/`. See `useDarkMode.ts` and `useImageAttachments.ts` as reference implementations.

## Module-Level Constants
These values MUST be declared at module scope, never inside a component function:
```ts
// src/components/chat/MarkdownRenderer.tsx
const REMARK_PLUGINS = [remarkGfm]; // declared once per module load
const MD_COMPONENTS = { code: CodeBlock, pre: ({ children }) => <>{children}</> };
```
Also applies to:
- `ACCEPT_TYPES` for file input `accept` attribute
- Any array or object used as a prop that never changes

Declaring these inside a component creates a new reference every render, breaking memoization and causing unnecessary re-renders downstream.

## Transport Pattern (useChat)
The `useChat` transport must be created exactly once per component mount using `useMemo` with an empty dependency array:
```ts
// ChatInterface.tsx
const modelRef = useRef(selectedModel);
const effortRef = useRef(selectedEffort);
const thinkingRef = useRef(thinkingEnabled);

// refs kept current in effects or event handlers
useEffect(() => { modelRef.current = selectedModel; }, [selectedModel]);

// transport closure captures refs, not state values
const transport = useMemo(() => new HttpTransport({
  url: '/api/chat',
  headers: () => ({
    'x-model': modelRef.current.id,
    'x-effort': effortRef.current.id,
  }),
}), []); // eslint-disable-next-line react-hooks/exhaustive-deps
```
WHY: `useChat` initializes its transport once on mount. If transport is recreated (e.g., passed as a dependency), `useChat` ignores updates after mount. Refs solve this without recreating the transport.

## Constants Separation
- `src/lib/constants.ts` — all shared configuration: `MODELS`, `EFFORT_LEVELS`, `SYSTEM_PROMPT`, `AUTH_COOKIE_NAME`, `COOKIE_MAX_AGE`, rate limit constants
- Component files — no hardcoded configuration values; import from `constants.ts`
- `constants.ts` is imported by both client and server code — never add `process.env` reads here

## API Validation Mirrors Client Constants
The server whitelist must be derived from the same `MODELS` array, not maintained separately:
```ts
// constants.ts
export const ALLOWED_MODEL_IDS = MODELS.map(m => m.id) as string[];
```
This ensures the server whitelist and client selector always stay in sync when a model is added or removed.

## Middleware is Lightweight
`proxy.ts` (Next.js middleware) runs on every non-static request. Keep it minimal:
- Only import from `src/lib/auth/cookies.ts` and `next/server`
- No database calls, no external HTTP requests
- No heavy computation
- If middleware grows beyond JWT verification + redirect, move logic to route handlers

## Single Auth Mechanism
Authentication uses exactly one mechanism: HTTP-only JWT cookie (`auth_session`). There is no:
- Session store / database sessions
- Local storage tokens
- Bearer tokens in headers
- OAuth / third-party auth

Any feature that needs to know if a user is authenticated reads the cookie via `verifyAuthCookie`. Do not add a second auth mechanism without removing the first.

## Directory Invariants
```
src/app/api/     — route handlers only (no React components)
src/app/         — pages and layouts only
src/components/  — React components (chat/ and ui/ subdirs)
src/hooks/       — custom hooks (useDarkMode, useImageAttachments)
src/lib/         — shared utilities, constants, auth logic
```
Do not put components in `src/lib/`. Do not put business logic in `src/components/`.
