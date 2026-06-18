# Architecture

## Component Hierarchy
```
app/layout.tsx
  app/auth/page.tsx          (unauthenticated route)
  app/page.tsx               (protected home)
    components/chat/ChatInterface.tsx
      components/chat/MessageList.tsx
        components/chat/MessageItem.tsx
          components/chat/MarkdownRenderer.tsx
            components/chat/CodeBlock.tsx
          components/ui/LoadingDots.tsx
      components/chat/InputArea.tsx
      components/chat/ModelSettings.tsx
```

## Data Flow: Chat Message
1. User types in `InputArea` → calls `append()` from `useChat`
2. `useChat` (from `@ai-sdk/react`) sends POST to `/api/chat` via `DefaultChatTransport`
3. `/api/chat/route.ts` receives `{ messages, modelId, effortId, enableThinking }`
4. Route validates `modelId` against `ALLOWED_MODEL_IDS`, resolves effort config
5. `streamText()` called with `anthropic(modelId)` provider and providerOptions for thinking
6. Response streamed back via `toUIMessageStreamResponse()`
7. `useChat` updates message list in real-time; `MessageList` auto-scrolls
8. `MessageItem` renders each message; reasoning blocks shown as collapsible sections

## Auth Flow
1. User visits any route → `proxy.ts` (Next.js Middleware) intercepts
2. Middleware calls `verifyAuthCookie(request)` using `jose` JWTVerify
3. If invalid/missing → redirect to `/auth`
4. `/auth/page.tsx` shows 4-digit code form
5. Submit → POST `/api/auth/verify` with `{ code }`
6. Route: `checkRateLimit(ip)` → compare code → `signAuthCookie()` → set HTTP-only cookie → return 200
7. Client redirects to `/`
8. Logout: POST `/api/auth/logout` → `buildClearCookieHeader()` → clear cookie → redirect to `/auth`

## State Management
- No global state store (no Redux, no Zustand, no Context for app state)
- `ChatInterface.tsx` owns all chat state: `messages` (from `useChat`), `selectedModelId`, `selectedEffortId`, `enableThinking`
- Refs (`modelRef`, `effortRef`, `thinkingRef`) hold current values for use inside transport closures
- Dark mode state is in the DOM (`documentElement.classList`) — `useDarkMode` hook reads/toggles it
- Image attachments are in `useImageAttachments` hook local state (Blob URLs)
- No persistence layer — all state lost on page refresh

## Hook Responsibilities

### `useDarkMode` (`src/hooks/useDarkMode.ts`)
- Reads initial dark state from `document.documentElement.classList.contains('dark')`
- MutationObserver watches for classList changes (allows external toggles to sync)
- Returns `{ isDark: boolean, toggle: () => void }`
- Cleanup: `observer.disconnect()` in useEffect return

### `useImageAttachments` (`src/hooks/useImageAttachments.ts`)
- Manages array of `{ id, url, file }` objects
- `add(files)`: creates Blob URLs via `URL.createObjectURL`
- `remove(id)`: revokes Blob URL via `URL.revokeObjectURL`, removes from array
- `clear()`: revokes all Blob URLs, empties array
- Cleanup: revokes all on unmount

## Key Design Decisions

### Transport created once (useMemo with `[]` deps)
`useChat` from `@ai-sdk/react` captures the transport reference at mount and ignores later changes. Transport is created once; fresh model/effort/thinking values are read via refs at send time. See `decisions.md`.

### Module-level REMARK_PLUGINS and MD_COMPONENTS
Defined once at module scope in `MarkdownRenderer.tsx`. If defined inside the component function, React sees new array/object references every render and re-renders the entire markdown tree unnecessarily.

### Middleware + Route-level auth
`proxy.ts` handles redirects for page routes. API routes (`/api/chat`) also verify the cookie independently. Defense in depth — middleware alone is not sufficient because it can be bypassed in some edge cases.

### Server-side model ID validation
`ALLOWED_MODEL_IDS` in `route.ts` prevents a client from injecting arbitrary model strings to the Anthropic API. Client input is never trusted for model selection.

## File Locations
```
src/
  app/
    api/chat/route.ts           streaming chat endpoint
    api/auth/verify/route.ts    login
    api/auth/logout/route.ts    logout
    auth/page.tsx               login UI
    page.tsx                    home (renders ChatInterface)
    layout.tsx                  root layout
    globals.css                 CSS custom properties + Tailwind
  components/chat/
    ChatInterface.tsx           main container
    MessageList.tsx             scrolling message list
    MessageItem.tsx             single message renderer
    InputArea.tsx               text input + image attach
    MarkdownRenderer.tsx        markdown + code
    CodeBlock.tsx               syntax highlighting
    ModelSettings.tsx           model/effort/thinking controls
  components/ui/
    LoadingDots.tsx             animated dots
  hooks/
    useDarkMode.ts
    useImageAttachments.ts
  lib/
    constants.ts                MODELS, EFFORT_LEVELS, SYSTEM_PROMPT, auth constants
    auth/
      cookies.ts                JWT sign/verify/header builders
      rate-limiter.ts           in-memory IP rate limiter
  proxy.ts                      Next.js Middleware (auth guard)
```
