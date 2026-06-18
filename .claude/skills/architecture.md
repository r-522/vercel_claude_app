# Skill: Architecture Decisions

Use this workflow when making structural decisions about the Claude AI Chat App.

## When to Create a New Hook vs Add to Existing

**Create a new hook** (`src/hooks/useNewName.ts`) when:
- The concern is clearly separable (single responsibility)
- It would be reusable in multiple components
- It manages external resources with lifecycle (Blob URLs, event listeners, timers)
- Adding to an existing hook would make that hook's return type significantly larger

**Add to an existing hook** when:
- The new state is tightly coupled to existing state in the hook
- Extracting would require passing many values between hooks
- The hook is already small and the addition is cohesive

**Never add** to `useDarkMode` — it has a single, fixed responsibility.
`useImageAttachments` is closed for new concerns beyond image lifecycle management.

## When to Add Server-Side Validation

Add server-side validation for ANY value that:
- Comes from the request body (user-controlled)
- Is used to call an external API (Anthropic SDK)
- Affects security or billing (model selection, token limits)

Do NOT add server-side validation for:
- Values that are already type-safe (TypeScript will catch misuse)
- Display-only values that never leave the client

Pattern: validate against explicit allowlists, never denylists.
```ts
const ALLOWED = ['value-a', 'value-b'] as const
if (!ALLOWED.includes(input)) return new Response('Bad Request', { status: 400 })
```

## How to Add a New Model

1. Edit `src/lib/constants.ts`:
   ```ts
   MODELS = [
     ...existingModels,
     {
       id: 'claude-new-model-id',  // exact Anthropic API model ID
       display: 'New Model',       // UI label
       family: 'sonnet',           // 'opus' | 'sonnet' | 'haiku'
       supportsThinking: true,     // whether extended thinking is available
     }
   ]
   ```

2. Verify `ALLOWED_MODEL_IDS` in `src/app/api/chat/route.ts` is derived from `MODELS.map(m => m.id)` — it should update automatically.

3. If `supportsThinking: false`, verify `src/components/chat/ModelSettings.tsx` disables the thinking toggle when this model is selected.

4. Test: select the new model, send a chat message, check Vercel logs confirm the correct model ID was used.

## How to Add a New Effort Level

Edit `src/lib/constants.ts`:
```ts
EFFORT_LEVELS = [
  ...existingLevels,
  {
    id: 'new-id',
    label: '日本語ラベル',  // Japanese label for UI
    budgetTokens: 8000,     // thinking token budget
    temperature: 0.6,       // 0.1 (precise) to 1.0 (creative)
  }
]
```

The `ModelSettings.tsx` component renders effort levels via `.map()` — no component changes needed.

Order matters: effort levels display in array order. Insert at the appropriate position relative to existing levels.

## How to Add a New API Endpoint

See `api-design.md` for the full pattern. Architectural rules:
- Always under `src/app/api/` — never a custom server
- Always `export const runtime = 'nodejs'`
- Always verify auth cookie before any logic
- No global state — Next.js API routes are stateless (each request is independent)

## How to Extend the Auth System

Current auth: single 4-digit code → JWT cookie → middleware verification.

**If adding multiple users:**
- Add a user ID to the JWT payload in `signAuthCookie()`
- Update `verifyAuthCookie()` to return the user ID
- Store user ID in a server-side session if needed (not in the JWT for sensitive data)
- Rate limit becomes per-user, not just per-IP

**If adding roles/permissions:**
- Add `role` field to JWT payload
- Verify role in API routes before executing privileged actions

**If increasing security:**
- Upgrade from 4-digit code to a proper password with bcrypt
- Add PKCE or OAuth if third-party login is needed
- Replace in-memory rate limiter with Redis/KV for persistence across instances

**Do NOT:**
- Store `ACCESS_CODE` in the JWT — it's a secret, not an identity claim
- Send the code in URL parameters — POST body only
- Use client-side cookies for auth — always HttpOnly

## Transport Pattern — Do Not Change

The `useMemo` transport in `ChatInterface.tsx` is intentionally created once. This is not a bug.

If you need to pass new per-message data to the API:
- Add a new `useRef` for the value
- Update the ref in a `useEffect` when the value changes
- Read `ref.current` inside the transport fetch closure

Do NOT:
- Add the new value to the transport `useMemo` dependency array
- Create a new transport instance on state change
- Use `useCallback` for the fetch function (same issue)

## Middleware (src/proxy.ts)

Next.js Middleware runs on every request at the edge. Keep it minimal:
- JWT verification only
- No database calls
- No complex logic
- Fast — adds latency to every request

If you need complex auth logic, do it in the API route handler, not middleware.
