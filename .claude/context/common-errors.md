# Common Errors & Solutions

Known errors encountered in development or production, with root causes and fixes.

---

## "COOKIE_SECRET must be set and at least 32 characters long"
**Where**: Server startup / first auth request  
**Cause**: `COOKIE_SECRET` environment variable is missing, empty, or shorter than 32 characters.  
**Fix**: Set `COOKIE_SECRET` in Vercel dashboard (or `.env.local` locally) to a random 32+ character string. Example: `openssl rand -base64 32`

---

## Auth redirect loop (keep getting sent back to /auth)
**Where**: Browser, after attempting to log in  
**Cause 1**: JWT has expired. `COOKIE_MAX_AGE = 2592000` (30 days). Cookie expired and wasn't renewed.  
**Cause 2**: `COOKIE_SECRET` was rotated or changed. Existing cookies signed with the old secret fail verification.  
**Fix**: Clear the `auth_session` cookie in browser dev tools, log in again. If caused by secret rotation, all users must re-authenticate.

---

## "[auth/verify] ACCESS_CODE environment variable is not set"
**Where**: Server log, during login attempt  
**Cause**: `ACCESS_CODE` is not set in the Vercel dashboard for the current environment (production/preview).  
**Fix**: Add `ACCESS_CODE` in Vercel → Project Settings → Environment Variables. Redeploy after adding.

---

## "Bad Request" from /api/chat
**Where**: Client receives 400 response  
**Cause**: Invalid JSON body, missing `messages` field, or empty messages array.  
**Fix**: Check the request body being sent. The transport should handle this automatically — if this appears in production, check if `convertToModelMessages` is returning an empty array (usually means the UIMessage parts were all non-text).

---

## "Unauthorized" from /api/chat
**Where**: Client receives 401 response  
**Cause**: JWT verification failed in the route handler. Most likely `COOKIE_SECRET` mismatch between the environment that signed the cookie and the environment that is verifying it.  
**Fix**: Ensure `COOKIE_SECRET` is identical in all Vercel environments (production, preview). If using multiple deployments, they must share the same secret.

---

## Streaming not working (response appears all at once or times out)
**Where**: /api/chat route  
**Cause**: Missing `export const runtime = 'nodejs'` at the top of `src/app/api/chat/route.ts`. Without this, Next.js may deploy the route to the Edge runtime, which handles streaming differently.  
**Fix**: Ensure `export const runtime = 'nodejs';` is present in `route.ts`.

---

## Dark mode flash on initial page load
**Where**: Browser, page load  
**Cause**: The inline script in `layout.tsx` that reads `localStorage` and sets `document.documentElement.classList` is missing, delayed, or placed after the `<body>`.  
**Fix**: The dark mode init script must be a synchronous `<script>` tag placed before any body content in `layout.tsx`. It must not be deferred or async.

---

## Model not switching when changing model selector
**Where**: ChatInterface, model/effort dropdown  
**Cause**: `modelRef.current` (or `effortRef.current` / `thinkingRef.current`) not being updated when state changes. The transport reads from refs, not state.  
**Fix**: Ensure that after the `useState` setter for model/effort/thinking, the corresponding ref is also updated: `modelRef.current = newModelId`. Both must happen — state for re-render, ref for transport closure.

---

## Image paste not working
**Where**: InputArea, Ctrl+V / paste event  
**Cause**: The `paste` event handler is not checking `item.type.startsWith('image/')` on each `clipboardData.items` entry, or the loop is using `for...of` which may not iterate `DataTransferItemList` correctly.  
**Fix**: Use a standard `for` loop over `clipboardData.items` (not `for...of`). Check `item.kind === 'file'` and `item.type.startsWith('image/')` before calling `item.getAsFile()`.

---

## Thinking toggle not enabling / grayed out
**Where**: ModelSettings component  
**Cause**: The currently selected model has `supportsThinking: false` (this is the case for Haiku 4.5). The toggle is intentionally disabled when `supportsThinking` is false.  
**Fix**: Switch to Opus 4.6 or Sonnet 4.6 to enable extended thinking. This is expected behavior, not a bug.

---

## Rate limit not resetting after waiting
**Where**: /api/auth/verify  
**Cause**: The in-memory rate limiter resets only when the Vercel function instance is recycled or a new deployment happens. The Map is per-instance and does not have TTL-based expiry unless implemented explicitly.  
**Fix (development)**: Restart the dev server (`npm run dev`) to reset the Map. **Fix (production)**: Trigger a redeployment, or wait for Vercel to recycle the function instance. This is a known limitation — see `decisions.md`.
