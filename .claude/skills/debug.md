# Skill: Debugging

Use this workflow to diagnose and locate issues in the Claude AI Chat App.

## Common Issues & Locations

### Streaming Not Working

Symptom: Chat sends but response never appears, or response arrives all at once after a long wait.

Check `src/app/api/chat/route.ts`:
1. `export const runtime = 'nodejs'` must be at the top — Edge runtime lacks Node.js APIs used by `@ai-sdk/anthropic`
2. The route must return `streamText(...).toDataStreamResponse()` — not `await streamText(...)`
3. Add temporary logging:
   ```ts
   console.log('[chat] model:', modelId, 'effort:', effortId)
   ```
   View in Vercel dashboard > Functions > Logs, or locally in `npm run dev` terminal output

### Auth Loop (Redirect to /auth Every Request)

Symptom: After login, every page immediately redirects back to `/auth`.

Check `src/proxy.ts`:
1. Middleware must exclude `/auth` and `/api/auth` paths from JWT verification
2. Cookie name in middleware must match `AUTH_COOKIE_NAME` from `src/lib/constants.ts`
3. Browser devtools > Application > Cookies: verify the cookie exists, has correct name, is not expired

Check `src/app/api/auth/verify/route.ts`:
1. Response must include `Set-Cookie` header from `buildCookieHeader()`
2. `COOKIE_SECRET` env var must be set — if missing, `jose` throws and cookie is never set

### Dark Mode Flash on Load

Symptom: Page loads in light mode briefly, then switches to dark.

Check `src/app/layout.tsx`:
- There must be an inline `<script>` tag (not a module script) before React content that reads `localStorage` and sets the `dark` class on `document.documentElement` synchronously
- The script runs before React hydration — if missing or broken, class is applied after hydration causing a flash

Check `src/hooks/useDarkMode.ts`:
- Should use `MutationObserver` on `document.documentElement` to detect class changes
- Should read initial state from `document.documentElement.classList.contains('dark')`

### Model Not Switching

Symptom: Changing model in UI has no effect — requests still use old model.

Root cause: transport `useMemo` runs once; model state captured at creation time is stale.

Check `src/components/chat/ChatInterface.tsx`:
1. `modelRef` must be updated via `useEffect` whenever `selectedModel` state changes: `useEffect(() => { modelRef.current = selectedModel }, [selectedModel])`
2. Inside the transport fetch closure, model must be read as `modelRef.current` — not from captured state

### Image Paste / Attach Not Working

Symptom: Pasting an image or attaching a file does nothing.

Check `src/components/chat/InputArea.tsx`:
1. `onPaste` handler must iterate `event.clipboardData?.items`
2. For each item: check `item.kind === 'file'` and `item.type.startsWith('image/')`
3. Call `item.getAsFile()` then pass to `useImageAttachments` `add()`

Check `src/hooks/useImageAttachments.ts`:
1. `add()` must call `URL.createObjectURL(file)` and store the URL
2. Verify the hook is wired to `InputArea` — `attached` passed as prop, `add`/`remove` callbacks passed

## How to Add Console Logging in Server Routes

In any file under `src/app/api/`:
```ts
console.log('[route-name] key:', value)
```

Logs appear:
- **Local dev**: in the terminal running `npm run dev`
- **Vercel**: dashboard > project > Functions tab > select the function > Logs

Remove debug logs before committing.

## How to Check Cookies in Browser DevTools

1. Open DevTools (F12)
2. Application tab > Storage > Cookies > select `localhost` or your domain
3. Look for the cookie named by `AUTH_COOKIE_NAME` (default: `auth-token` — verify in `src/lib/constants.ts`)
4. Check: Value is not empty, Expires is in the future, HttpOnly is checked, Path is `/`

## How to Check Network Requests

1. DevTools > Network tab
2. Filter by `Fetch/XHR`
3. On chat send: look for POST to `/api/chat` — response should be `text/event-stream`
4. On login: look for POST to `/api/auth/verify` — response should set `Set-Cookie` header

## Systematic Debugging Steps

1. Read the relevant source file before guessing
2. Add a single `console.log` at the point where you suspect the issue
3. Reproduce the symptom
4. Check the log
5. Narrow scope and repeat
6. Remove all debug logs when done
