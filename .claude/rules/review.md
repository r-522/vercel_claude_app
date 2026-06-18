# Code Review Rules

Related: [security rules](./security.md), [architecture rules](./architecture.md), [react rules](./react.md)

## Blocking Issues (Must Fix Before Merge)

### Secrets in Client Code
Run this check on every PR touching `src/lib/constants.ts` or any file without `'use client'`:
```
grep -r "ACCESS_CODE\|COOKIE_SECRET" src/lib/constants.ts src/components/ src/hooks/
```
Any match is a hard block. Secrets must only appear in server-side code accessed via `process.env`.

### Auth Validation Missing
Every route handler in `src/app/api/` except `auth/verify` and `auth/logout` must call `verifyAuthCookie`. Check that the call exists and that the route returns 401 if verification fails.

### Transport Deps Not Empty
The `useMemo` for transport in `ChatInterface.tsx` must have `[]` as its dependency array. Any other deps array breaks the ref-based fresh-value pattern.

### Local Dark Mode State
Any component outside `useDarkMode.ts` that declares `const [isDark, setIsDark] = useState(...)` is a violation. Dark mode state is owned exclusively by `useDarkMode`.

## High-Priority Issues (Fix Before Merge)

### Blob URL Leaks
Any new `URL.createObjectURL()` call must have a corresponding `URL.revokeObjectURL()` in a cleanup path. Check `useEffect` returns and unmount patterns.

### ESLint Disable Without Comment
Every `// eslint-disable` comment must have a trailing explanation of WHY:
```ts
// correct
// eslint-disable-next-line react-hooks/exhaustive-deps — transport must never be recreated
const transport = useMemo(() => ..., []);

// wrong — no explanation
// eslint-disable-next-line react-hooks/exhaustive-deps
const transport = useMemo(() => ..., []);
```

### Model ID Validation Missing
Any route that accepts a `model` field from the request body must validate it against `ALLOWED_MODEL_IDS` before passing it to the AI SDK.

## Standard Review Checklist

### TypeScript
- [ ] No `any` in function signatures or return types (only in `catch` clauses)
- [ ] `import type` used for type-only imports
- [ ] New config arrays use `as const`

### React
- [ ] `'use client'` present on components using hooks or events
- [ ] No `useEffect` used to derive state (use `useMemo` or inline)
- [ ] Stable objects (`REMARK_PLUGINS`, `MD_COMPONENTS`) declared at module level

### Japanese UI Strings
All user-facing labels in components must remain in Japanese. Do not replace:
- Model/effort labels (`低`, `中`, `高`, `超高`, `最大`)
- UI button text (`送信`, `停止`, etc.)
- Placeholder text

English is acceptable only for: code comments, type names, console logs, and error keys.

### Accessibility
- [ ] New icon-only buttons have `aria-label`
- [ ] New custom controls have correct `role` and `aria-*` attributes
- [ ] New decorative SVGs have `aria-hidden="true"`

### Performance
- [ ] No new constant objects/arrays declared inside component functions
- [ ] New Blob URLs have corresponding revocation

### Backend
- [ ] Rate limit check precedes secret comparison in auth routes
- [ ] `request.json()` wrapped in try/catch
- [ ] `export const runtime = 'nodejs'` present on routes using `jose` or in-memory state
