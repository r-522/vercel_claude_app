# Skill: Bug Fix

Use this workflow to investigate and fix bugs in the Claude AI Chat App.

## 1. Classify the Bug

Ask: where does the symptom appear?

| Symptom | Likely Layer |
|---|---|
| UI wrong / missing / flashes | Client component |
| Chat response not streaming | API route or transport |
| 401 / redirect loop | Auth (cookie, middleware, JWT) |
| Wrong model used | Transport closure / refs |
| Image not sending | useImageAttachments or InputArea |
| Dark mode wrong on load | layout.tsx inline script |

## 2. Client-Side Bugs

**Transport closure (model/effort not switching)**
- File: `src/components/chat/ChatInterface.tsx`
- Cause: `transport` useMemo runs once; if model state is captured directly in the closure it is stale
- Fix: Verify model/effort/thinking are read from refs (`modelRef.current`, etc.) inside the fetch function, not from state directly
- Never add state variables to the transport useMemo dependency array

**Blob URL leak (images)**
- File: `src/hooks/useImageAttachments.ts`
- Cause: `URL.createObjectURL` called but `URL.revokeObjectURL` never called
- Fix: Ensure `clear()` calls `revokeObjectURL` on each URL; `useEffect` cleanup should call `clear()`

**Dark mode flash on load**
- File: `src/app/layout.tsx`
- Cause: Tailwind dark class applied after hydration
- Fix: The inline `<script>` that runs before React hydration must set `dark` on `document.documentElement` based on `localStorage`. Verify it exists and runs correctly.
- Hook file: `src/hooks/useDarkMode.ts` — uses MutationObserver; check it observes `documentElement.classList`

**Dark mode wrong in component**
- Cause: Component reads `isDark` from local state or direct DOM instead of `useDarkMode()`
- Fix: Replace with `const { isDark } = useDarkMode()` from `@/hooks/useDarkMode`

**MarkdownRenderer re-render / plugin error**
- File: `src/components/chat/MarkdownRenderer.tsx`
- Cause: REMARK_PLUGINS or MD_COMPONENTS defined inside component function — new reference each render
- Fix: Move both to module level (outside the component function)

## 3. Server-Side Bugs

**Streaming not working**
- File: `src/app/api/chat/route.ts`
- Check: `export const runtime = 'nodejs'` must be present — Edge runtime does not support all Node.js APIs used by `@ai-sdk/anthropic`
- Check: `streamText` result returned as streaming response, not awaited to completion

**Wrong model on server**
- File: `src/app/api/chat/route.ts`
- Check: Body parsing extracts `modelId`; server validates against `ALLOWED_MODEL_IDS`
- If model ID is invalid, server should return 400 before calling Anthropic API

**Rate limit not resetting**
- File: `src/lib/auth/rate-limiter.ts`
- Note: In-memory Map — resets on every Vercel cold start. This is expected behavior.

## 4. Auth Bugs

**Auth loop (redirect back to /auth repeatedly)**
- File: `src/proxy.ts` (Next.js Middleware)
- Check: Middleware must NOT apply to the `/auth` route or `/api/auth/*` routes
- Check: Cookie name matches `AUTH_COOKIE_NAME` from `src/lib/constants.ts` in both middleware and API routes

**Cookie not set after login**
- File: `src/app/api/auth/verify/route.ts`
- Check: `buildCookieHeader` called with correct arguments
- Check: Response includes `Set-Cookie` header
- Browser devtools: Application > Cookies — verify cookie name, path, HttpOnly, SameSite

**JWT verification failing**
- File: `src/lib/auth/cookies.ts`
- Check: `COOKIE_SECRET` env var is set and matches between sign and verify calls
- Check: Cookie not expired (`COOKIE_MAX_AGE` from `src/lib/constants.ts`)

## 5. Fix Pattern

1. Read the relevant file(s) before editing
2. Make the minimal change that fixes the root cause
3. Do not add error handling for impossible scenarios
4. Do not add comments unless the WHY is non-obvious

## 6. Verification

```
npx tsc --noEmit
npx next lint
```

Manual test:
- [ ] Bug symptom is gone
- [ ] Adjacent functionality still works (e.g., if fixing model switching, verify effort level still works)
- [ ] No new console errors
- [ ] Test both light and dark mode if UI was touched
