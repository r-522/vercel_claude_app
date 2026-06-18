# Code Review Checklist

Work through sections in priority order: Security → Pattern Compliance → TypeScript → Performance → UX/Accessibility.

---

## 1. Security (highest priority — block merge if any item fails)

- [ ] `grep -r 'ACCESS_CODE\|COOKIE_SECRET\|ANTHROPIC_API_KEY' src/components/ src/hooks/` returns no matches
- [ ] Every new file under `src/app/api/` (except `auth/`) calls `verifyAuthCookie()` before any business logic
- [ ] `src/app/api/auth/verify/route.ts`: `checkRateLimit(ip)` is called BEFORE the access code string comparison
- [ ] Cookie attributes in `buildCookieHeader`: `HttpOnly` present, `SameSite=Lax` present, `Secure` added in production, `Max-Age` set to `COOKIE_MAX_AGE`
- [ ] Any new client-controlled parameter (e.g., model ID) is validated on the server against an allowlist before use
- [ ] Error responses are generic — they do not reveal which field failed or whether a code was close

---

## 2. Pattern Compliance

- [ ] Dark mode: `useDarkMode` hook used everywhere; no component introduces its own `const [isDark, setIsDark]`
- [ ] `MarkdownRenderer.tsx`: `REMARK_PLUGINS` and `MD_COMPONENTS` are defined at module level, not inside the component body or render path
- [ ] `ChatInterface.tsx`: transport `useMemo` has `[]` dependency array; dynamic values (model, effort, thinking) are accessed through refs (`modelRef`, `effortRef`, `thinkingRef`) inside the `fetch` call
- [ ] `useImageAttachments`: `URL.revokeObjectURL` called in both `remove()` and `clear()`; cleanup effect revokes all remaining URLs on unmount
- [ ] No new hook that subscribes to an external source or creates a timer/observer omits the cleanup return from `useEffect`

---

## 3. TypeScript

- [ ] No bare `any` type (only acceptable in `catch (e: any)` clauses when necessary)
- [ ] `import type` used for every import that is only needed at the type level
- [ ] No new `as SomeType` type assertions without an inline comment explaining why the cast is safe
- [ ] All `// eslint-disable` directives include a comment explaining the intentional exception

---

## 4. Performance

- [ ] No object literal or arrow function defined directly in a JSX prop (e.g., `style={{ }}`, `onClick={() => ...}`) on a component that renders frequently without memoization
- [ ] `react-syntax-highlighter` styles imported from `/dist/esm/styles/prism/...` (not the root bundle)
- [ ] `npm run build` bundle sizes have not regressed significantly versus the previous build

---

## 5. UX / Accessibility

- [ ] Every new icon-only button has `aria-label`
- [ ] Any custom toggle (thinking switch) has `role="switch"` and `aria-checked`
- [ ] Custom radio group (effort levels) has `role="radiogroup"` with `role="radio"` + `aria-checked` per item
- [ ] Decorative SVGs have `aria-hidden="true"`
- [ ] Japanese UI strings are unmodified (check Query/Result labels, effort level labels 低/中/高/超高/最大, model display names)
- [ ] New UI elements are reachable and operable via keyboard alone
