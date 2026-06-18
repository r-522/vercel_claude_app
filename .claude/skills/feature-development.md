# Skill: Feature Development

Use this workflow when adding a new feature to the Claude AI Chat App.

## 1. Classify the Feature

Determine where the feature lives:
- **UI only** — new or modified component under `src/components/`
- **Client state** — new hook under `src/hooks/`
- **API** — new route under `src/app/api/`
- **Config change** — `src/lib/constants.ts` (MODELS, EFFORT_LEVELS)
- **Auth** — `src/lib/auth/` or `src/proxy.ts`

## 2. Adding a New Hook

Create `src/hooks/useFeatureName.ts`.

Rules:
- Export a single object `{ value, action, ... }` — never export multiple independent functions
- Blob URLs: use the `useImageAttachments` pattern — create in effect, revoke on cleanup
- Dark mode: import `useDarkMode` from `@/hooks/useDarkMode` — never local `useState` for dark
- No comments unless the WHY is non-obvious

Example structure:
```ts
'use client'
import { useState, useCallback } from 'react'

export function useFeatureName() {
  const [state, setState] = useState(initialValue)

  const action = useCallback(() => {
    // ...
  }, [])

  return { state, action }
}
```

## 3. Adding a New Component

Create `src/components/chat/FeatureName.tsx` (or `ui/` for generic UI).

Rules:
- `'use client'` at top if it uses hooks or browser APIs
- `import type` for type-only imports
- Dark mode: call `useDarkMode()` from `@/hooks/useDarkMode` — never read `document.documentElement.classList` directly
- Stable references: NEVER define objects/arrays inside JSX or inside the component body that are used as props — define them at module level
- If using ReactMarkdown: REMARK_PLUGINS and MD_COMPONENTS MUST be module-level constants

Example:
```tsx
'use client'
import type { FC } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'

// Module-level — stable reference
const STATIC_PROP = { key: 'value' }

interface Props {
  value: string
}

const FeatureName: FC<Props> = ({ value }) => {
  const { isDark } = useDarkMode()
  return <div className={isDark ? 'dark-class' : 'light-class'}>{value}</div>
}

export default FeatureName
```

## 4. Adding a New API Endpoint

Create `src/app/api/feature/route.ts`.

Always include:
```ts
export const runtime = 'nodejs'
```

Auth verification (copy from `src/app/api/chat/route.ts`):
```ts
import { verifyAuthCookie } from '@/lib/auth/cookies'
import { AUTH_COOKIE_NAME } from '@/lib/constants'
import { cookies } from 'next/headers'

const cookieStore = await cookies()
const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
if (!token) return new Response('Unauthorized', { status: 401 })
await verifyAuthCookie(token) // throws if invalid
```

Validate request body before use. Never trust client-supplied model IDs — check against `ALLOWED_MODEL_IDS` from `src/lib/constants.ts`.

## 5. Extending MODELS

Edit `src/lib/constants.ts`:
1. Add entry to `MODELS` array with `id`, `display`, `family`, `supportsThinking`
2. `ALLOWED_MODEL_IDS` is derived automatically as `MODELS.map(m => m.id)` — verify this is used in `src/app/api/chat/route.ts` for server-side validation

## 6. Extending EFFORT_LEVELS

Edit `src/lib/constants.ts`:
1. Add entry to `EFFORT_LEVELS` with `id`, `label` (Japanese), `budgetTokens`, `temperature`
2. Check `src/components/chat/ModelSettings.tsx` renders it via `.map()` — no changes needed if it does

## 7. Integrating Into ChatInterface

`src/components/chat/ChatInterface.tsx` is the main container. Key rules:
- `transport` is created once via `useMemo` with intentional ESLint disable — do NOT add new deps
- State that changes between messages must use refs (`modelRef`, `effortRef`, `thinkingRef`) captured inside the transport's `fetch` closure
- Add new state refs if the feature affects per-message behavior

## 8. Verification Steps

Run in order:
```
npx tsc --noEmit
npx next lint
npm run build
```

Manual test checklist:
- [ ] Feature works in light mode and dark mode
- [ ] Feature works after page refresh (auth cookie still valid)
- [ ] No console errors in browser devtools
- [ ] Network tab: no unexpected requests or 401s
- [ ] If new API route: test with curl or browser fetch directly
