# Dependencies

Key dependency notes, version constraints, and import paths that are non-obvious or easy to get wrong.

---

## AI SDK Triple — Must Stay Compatible
These three packages must be mutually compatible. Current pinned versions:
- `ai` 6.0.206
- `@ai-sdk/anthropic` 3.0.84
- `@ai-sdk/react` 3.0.208

Do not upgrade one without checking the others. The AI SDK v6 API (especially `UIMessage`, `convertToModelMessages`, `DefaultChatTransport`, `toUIMessageStreamResponse`) differs significantly from v3/v4.

### Correct import sources
```ts
import { useChat } from '@ai-sdk/react';                    // NOT from 'ai'
import { DefaultChatTransport, convertToModelMessages,
         streamText, convertFileListToFileUIParts } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { UIMessage, FileUIPart } from 'ai';
```

---

## jose 6.x
JWT signing and verification. The v6 API uses `SignJWT` / `jwtVerify` with `TextEncoder` for secrets:
```ts
import { SignJWT, jwtVerify } from 'jose';
const secret = new TextEncoder().encode(process.env.COOKIE_SECRET);
```
Do not use the v4/v5 pattern of `jose.importJWK` or `jose.createSecretKey` for HS256 — pass the encoded Uint8Array directly.

---

## react-syntax-highlighter — Import Path Matters
For tree-shaking, styles must be imported from the ESM dist path:
```ts
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
```
Never import from the CJS path (`/dist/cjs/`) or the root — it bundles all themes.

---

## Next.js 16 — App Router Only
This project uses the App Router exclusively. No `pages/` directory exists. Route handlers are `route.ts` files, not `pages/api/*.ts`. Middleware is `src/proxy.ts` (configured via `matcher` in the file). Layout nesting is via `layout.tsx` files.

Special directive required for streaming in route handlers:
```ts
export const runtime = 'nodejs';
```
Without this, the route may run in the Edge runtime, which has a different streaming API.

---

## React 19
- No legacy patterns: no `ReactDOM.render`, no class components, no `forwardRef` (use `ref` prop directly in React 19)
- Server Components are available but currently all interactive components use `'use client'`
- `useEffect`, `useState`, `useRef`, `useMemo` work as expected

---

## TypeScript 6 Strict
- `strict: true` — no implicit any, strict null checks, exact optional property types
- `import type` for type-only imports (enforced by lint)
- No `any` unless unavoidable (use `unknown` + narrowing instead)

---

## Tailwind CSS 4.x
- v4 uses a PostCSS plugin approach, not the v3 JIT config
- Configuration is in `postcss.config.mjs` and CSS `@import 'tailwindcss'`
- `tailwind.config.js` may not exist — v4 auto-scans for class usage
- Custom design tokens are CSS custom properties in `globals.css` (not Tailwind theme extension)

---

## react-markdown 10.x
- Requires `remarkPlugins` and `components` props; pass module-level constants only
- `remark-gfm` 4.x is the correct peer for react-markdown 10
- Import: `import ReactMarkdown from 'react-markdown'` (default export)
- Import: `import remarkGfm from 'remark-gfm'`

---

## ESLint 9 + eslint-config-next
- Flat config format (`eslint.config.mjs` or similar) — not `.eslintrc.json`
- The `// eslint-disable-next-line react-hooks/exhaustive-deps` on the transport `useMemo` is intentional and must not be removed
