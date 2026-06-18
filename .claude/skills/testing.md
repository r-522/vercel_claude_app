# Skill: Testing

This project currently has no test suite. Use this workflow to add tests in the future, and to understand what the current type-check serves as a substitute for.

## Current Smoke Test (No Test Suite)

Until a test framework is added, use these as the smoke test:
```
npx tsc --noEmit    # catches type errors across all files
npx next lint       # catches ESLint issues
npm run build       # catches build-time errors (imports, missing modules)
```

These catch: broken imports, type mismatches, missing exports, and syntax errors.

## What to Test When a Test Suite Is Added

### Priority 1 — Hooks

`src/hooks/useDarkMode.ts`
- Returns `isDark: false` when no dark class on documentElement
- Returns `isDark: true` when dark class is present
- `toggle()` adds/removes the dark class and updates localStorage
- MutationObserver fires and `isDark` updates when class changes externally

`src/hooks/useImageAttachments.ts`
- `add()` creates a Blob URL and appends to `attached`
- `remove()` calls `URL.revokeObjectURL` and removes from `attached`
- `clear()` calls `URL.revokeObjectURL` on all URLs and empties `attached`
- Unmount cleanup: `clear()` called automatically

### Priority 2 — API Routes

`src/app/api/auth/verify/route.ts`
- Returns 429 when rate limit exceeded (before code comparison)
- Returns 401 when code is wrong
- Returns 200 + Set-Cookie when code is correct
- Set-Cookie is HttpOnly, SameSite=Lax

`src/app/api/auth/logout/route.ts`
- Returns 200
- Clears the auth cookie (Max-Age=0 or Expires in the past)

`src/app/api/chat/route.ts`
- Returns 401 when no auth cookie present
- Returns 400 when modelId is not in ALLOWED_MODEL_IDS
- Returns streaming response when request is valid

`src/lib/auth/rate-limiter.ts`
- Allows requests under the limit
- Blocks after `RATE_LIMIT_MAX_ATTEMPTS` in `RATE_LIMIT_WINDOW_MS`
- Returns correct `remaining` count

### Priority 3 — Auth Utilities

`src/lib/auth/cookies.ts`
- `signAuthCookie()` produces a JWT
- `verifyAuthCookie()` accepts the JWT from `signAuthCookie()`
- `verifyAuthCookie()` throws on tampered token
- `verifyAuthCookie()` throws on expired token

## What NOT to Mock

- **jose**: Test with real `jose` — mocking it tests nothing about actual JWT behavior. Use the real functions with a test `COOKIE_SECRET`.
- **Rate limiter**: Test with the real in-memory implementation. Reset between tests by clearing the internal Map (export a `reset()` for test use only, gated behind `NODE_ENV === 'test'`).
- **Next.js Request/Response**: Use real `Request` objects from the Fetch API (Node 18+ supports this natively).

## What CAN Be Mocked

- `fetch` calls to Anthropic API — return a mock streaming response
- `Date.now()` — to test rate limit window expiry without waiting
- `document` and `localStorage` — use jsdom (built into Vitest/Jest by default for DOM tests)

## Test File Structure Convention

Mirror the source tree:
```
src/
  hooks/
    useDarkMode.test.ts
    useImageAttachments.test.ts
  lib/
    auth/
      cookies.test.ts
      rate-limiter.test.ts
  app/
    api/
      auth/
        verify/route.test.ts
        logout/route.test.ts
      chat/route.test.ts
```

## Recommended Test Framework

When adding tests, use **Vitest** (not Jest):
- Native ESM support
- Fast with no Babel transform needed
- Compatible with Next.js App Router
- `npm install -D vitest @vitest/ui jsdom`

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui"
}
```

## Running the Smoke Test

Always run before any commit or deployment:
```
npx tsc --noEmit && npx next lint && npm run build
```

All three must pass with zero errors.
